import { useCallback, useEffect, useMemo, useState } from 'react';
import { describeError, isSupabaseConfigured, supabase, SUPABASE_SETUP_MESSAGE } from './supabase';
import type { RowOf, TableName } from './database.types';

/**
 * One data-access hook for every table in the app.
 *
 * Each page used to keep its data in localStorage, which meant it vanished on
 * another device and could be read by the next person who used the same
 * browser. This hook reads and writes the real database instead, and every
 * screen gets the same four states the design needs: loading, error, empty
 * and loaded.
 */
export interface Collection<TRow, TModel> {
  items: TModel[];
  loading: boolean;
  error: string | null;
  /** True once a load has finished and returned nothing, for empty states. */
  empty: boolean;
  refresh: () => Promise<void>;
  create: (values: Partial<TRow>) => Promise<TModel | null>;
  update: (id: string, values: Partial<TRow>) => Promise<TModel | null>;
  remove: (id: string) => Promise<boolean>;
}

export interface CollectionOptions<TRow, TModel> {
  table: TableName;
  /** Turns a database row into the shape the UI expects. */
  map: (row: TRow) => TModel;
  /** Column to sort by. Defaults to newest first. */
  order?: { column: string; ascending?: boolean };
  /** Skip loading until this is true, e.g. until the session is known. */
  enabled?: boolean;
  /** Extra filter applied to every read, e.g. a selected family member. */
  filter?: Partial<TRow>;
}

export function useCollection<TRow extends RowOf<TableName>, TModel>({
  table,
  map,
  order = { column: 'created_at', ascending: false },
  enabled = true,
  filter,
}: CollectionOptions<TRow, TModel>): Collection<TRow, TModel> {
  const [rows, setRows] = useState<TRow[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Serialised so the effect only re-runs when the filter really changes.
  const filterKey = useMemo(() => JSON.stringify(filter ?? {}), [filter]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    if (!isSupabaseConfigured) {
      setError(SUPABASE_SETUP_MESSAGE);
      setLoading(false);
      setLoaded(true);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase.from(table).select('*');
    if (filterKey && filterKey !== '{}') {
      for (const [column, value] of Object.entries(JSON.parse(filterKey) as Record<string, unknown>)) {
        if (value === null || value === undefined) continue;
        query = query.eq(column, value as never);
      }
    }
    query = query.order(order.column, { ascending: order.ascending ?? false });

    const { data, error: failure } = await query;
    if (failure) {
      setError(describeError(failure));
      setRows([]);
    } else {
      setRows((data ?? []) as TRow[]);
    }
    setLoading(false);
    setLoaded(true);
  }, [table, order.column, order.ascending, filterKey, enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [refresh, enabled]);

  const create = useCallback(
    async (values: Partial<TRow>) => {
      if (!isSupabaseConfigured) {
        setError(SUPABASE_SETUP_MESSAGE);
        return null;
      }
      const { data, error: failure } = await supabase
        .from(table)
        .insert(values as never)
        .select('*')
        .single();

      if (failure) {
        setError(describeError(failure));
        return null;
      }
      setError(null);
      const row = data as TRow;
      setRows((previous) => [row, ...previous]);
      return map(row);
    },
    [table, map],
  );

  const update = useCallback(
    async (id: string, values: Partial<TRow>) => {
      if (!isSupabaseConfigured) {
        setError(SUPABASE_SETUP_MESSAGE);
        return null;
      }
      const { data, error: failure } = await supabase
        .from(table)
        .update(values as never)
        .eq('id', id)
        .select('*')
        .single();

      if (failure) {
        setError(describeError(failure));
        return null;
      }
      setError(null);
      const row = data as TRow;
      setRows((previous) => previous.map((item) => (('id' in item && item.id === id ? row : item) as TRow)));
      return map(row);
    },
    [table, map],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!isSupabaseConfigured) {
        setError(SUPABASE_SETUP_MESSAGE);
        return false;
      }
      const { error: failure } = await supabase.from(table).delete().eq('id', id);

      if (failure) {
        setError(describeError(failure));
        return false;
      }
      setError(null);
      setRows((previous) =>
        previous.filter((item) => !('id' in item) || item.id !== id),
      );
      return true;
    },
    [table],
  );

  return {
    items: useMemo(() => rows.map(map), [rows, map]),
    loading,
    error,
    empty: loaded && !loading && rows.length === 0,
    refresh,
    create,
    update,
    remove,
  };
}

/**
 * A single row keyed by the account, used for doctor prep notes where there is
 * only ever one row per person.
 */
export function useSingleRow<TRow extends RowOf<TableName>, TModel>(
  table: TableName,
  map: (row: TRow) => TModel,
  enabled = true,
): {
  value: TModel | null;
  loading: boolean;
  error: string | null;
  save: (values: Partial<TRow>) => Promise<boolean>;
} {
  const [row, setRow] = useState<TRow | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured) {
      setError(SUPABASE_SETUP_MESSAGE);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: failure } = await supabase.from(table).select('*').maybeSingle();
    if (failure) {
      setError(describeError(failure));
    } else {
      setError(null);
      setRow((data as TRow | null) ?? null);
    }
    setLoading(false);
  }, [table, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (values: Partial<TRow>) => {
      if (!isSupabaseConfigured) {
        setError(SUPABASE_SETUP_MESSAGE);
        return false;
      }
      // Upsert: the row is created on first save and replaced afterwards.
      const { data, error: failure } = await supabase
        .from(table)
        .upsert(values as never)
        .select('*')
        .single();

      if (failure) {
        setError(describeError(failure));
        return false;
      }
      setError(null);
      setRow(data as TRow);
      return true;
    },
    [table],
  );

  return {
    value: row ? map(row) : null,
    loading,
    error,
    save,
  };
}