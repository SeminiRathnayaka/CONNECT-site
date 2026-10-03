import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button, buttonClass } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/FormControls';
import { LoadingState } from '../../components/ui/LoadingState';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import type { ProfileDetails } from '../../hooks/useProfile';
import { initialsFrom } from '../../lib/mappers';
import { formatDate } from '../../utils/dates';

const genderOptions = [
  { value: '', label: 'Not set' },
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Other', label: 'Other' },
];

/** Turns the multiline textarea text into a clean list. */
const toList = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

export default function Profile() {
  const { profile, loading, error, saveProfile } = useProfile();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<ProfileDetails>(profile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fill the form once the saved values arrive.
  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const update = <K extends keyof ProfileDetails>(key: K, value: ProfileDetails[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setMessage(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const ok = await saveProfile({
        fullName: form.fullName,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodType: form.bloodType,
        address: form.address,
        allergies: toList(form.allergies.join('\n')),
        conditions: toList(form.conditions.join('\n')),
        medications: toList(form.medications.join('\n')),
        emergencyNotes: toList(form.emergencyNotes.join('\n')),
      });

      setSaving(false);
      if (!ok) {
        setMessage('Could not save your details. Please try again.');
        return;
      }
      toast('Profile updated.');
    } catch (failure) {
      setSaving(false);
      setMessage(failure instanceof Error ? failure.message : 'Could not save your details.');
    }
  };

  if (loading) {
    return (
      <div className="page-container py-6 sm:py-8">
        <LoadingState label="Loading your profile…" />
      </div>
    );
  }

  const name = form.fullName.trim() || user?.name || 'Member';

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="Your account"
        title="Profile"
        description="The details CONNECT uses for your reports, reminders and emergency information."
        icon={<UserRound className="h-6 w-6" aria-hidden />}
        actions={
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </Button>
        }
      />

      {error ? (
        <p
          role="alert"
          className="mb-5 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <GlassCard>
          <form onSubmit={(event) => void submit(event)} className="grid gap-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={name} initials={initialsFrom(name)} accent="blue" size="xl" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-ink-900">{name}</h2>
                <p className="flex items-center gap-1.5 text-sm text-ink-500">
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                autoComplete="name"
                required
              />
              <Input
                label="Date of birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => update('dateOfBirth', e.target.value)}
                hint={form.dateOfBirth ? `${formatDate(form.dateOfBirth)}` : undefined}
              />
              <Select
                label="Gender"
                value={form.gender}
                onChange={(e) => update('gender', e.target.value)}
                options={genderOptions}
              />
              <Input
                label="Blood type"
                value={form.bloodType}
                onChange={(e) => update('bloodType', e.target.value)}
                placeholder="e.g. O+"
              />
              <Input
                label="Phone number"
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                autoComplete="tel"
              />
              <Input
                label="Address"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                autoComplete="street-address"
              />
            </div>

            <div className="border-t border-ink-100 pt-5">
              <h3 className="mb-1 text-sm font-bold text-ink-900">Emergency information</h3>
              <p className="mb-4 text-xs text-ink-500">
                Shown on the Emergency screen. One item per line.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Textarea
                  label="Allergies"
                  value={form.allergies.join('\n')}
                  onChange={(e) => update('allergies', toList(e.target.value))}
                  className="min-h-24"
                  placeholder={'Penicillin\nPeanuts'}
                />
                <Textarea
                  label="Conditions"
                  value={form.conditions.join('\n')}
                  onChange={(e) => update('conditions', toList(e.target.value))}
                  className="min-h-24"
                  placeholder={'Asthma\nHypertension'}
                />
                <Textarea
                  label="Current medications"
                  value={form.medications.join('\n')}
                  onChange={(e) => update('medications', toList(e.target.value))}
                  className="min-h-24"
                  placeholder={'Salbutamol inhaler\nAmlodipine 5mg'}
                />
                <Textarea
                  label="Emergency notes"
                  value={form.emergencyNotes.join('\n')}
                  onChange={(e) => update('emergencyNotes', toList(e.target.value))}
                  className="min-h-24"
                  placeholder={'Mum is contact: 07700 900123\nI am allergic to latex'}
                />
              </div>
            </div>

            {message ? (
              <p role="alert" className="text-sm font-medium text-red-700">
                {message}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              <Link to="/emergency" className={buttonClass('ghost', 'sm')}>
                View emergency summary
              </Link>
            </div>
          </form>
        </GlassCard>

        <div className="flex flex-col gap-5">
          <GlassCard>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900">
              <ShieldCheck className="h-4 w-4 text-primary-500" aria-hidden />
              Privacy
            </h2>
            <p className="text-sm text-ink-600">
              Your records are stored in your own private database space. Other people cannot see
              them, and each request is checked against your account before anything is returned.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="ok">Private by default</Badge>
              <Badge tone="ok">Row Level Security</Badge>
            </div>
          </GlassCard>

          {user?.joinedAt ? (
            <GlassCard>
              <h2 className="mb-2 text-sm font-bold text-ink-900">Account</h2>
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Member since</dt>
                  <dd className="font-semibold text-ink-900">{formatDate(user.joinedAt.slice(0, 10))}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Email</dt>
                  <dd className="truncate font-semibold text-ink-900">{user.email}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-ink-400">
                Need to change your password? Use the reset link on the sign-in page.
              </p>
            </GlassCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}