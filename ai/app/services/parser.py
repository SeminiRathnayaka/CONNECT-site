import re

HEADER_WORDS = ("test", "analyte", "investigation", "parameter", "description")
VALUE_WORDS = ("result", "value", "reading")
RANGE_WORDS = ("reference", "normal", "range", "biological")

NUMBER = r"[-+]?\d{1,3}(?:,\d{3})+(?:\.\d+)?|[-+]?\d*\.?\d+"

BETWEEN_RE = re.compile(rf"^\s*({NUMBER})\s*(?:-|–|—|to|~)\s*({NUMBER})\s*$")
LOWER_RE = re.compile(rf"^\s*(?:<|<=|≤|below)\s*({NUMBER})\s*$")
UPPER_RE = re.compile(rf"^\s*(?:>|>=|≥|above)\s*({NUMBER})\s*$")
COMPARATOR_RE = re.compile(rf"^\s*(?P<op><|<=|≤|>|>=|≥)\s*(?P<limit>{NUMBER})\s*$")
FIRST_NUMBER_RE = re.compile(NUMBER)
INLINE_RE = re.compile(
    rf"^\s*(?P<value>{NUMBER})\s*(?P<unit>[^\d\s][^\d]*?)\s*"
    rf"(?P<low>{NUMBER})\s*(?:-|–|—|to|~)\s*(?P<high>{NUMBER})\s*$"
)

SKIP_TERMS = (
    "page",
    "printed",
    "verified",
    "signature",
    "authorised",
    "authorized",
    "laborator",
    "hospital",
    "clinic",
    "address",
    "tel:",
    "phone",
    "email",
    "www",
    "http",
)


def _to_float(token: str):
    try:
        return float(str(token).replace(",", "").replace("+", "").strip())
    except (ValueError, AttributeError):
        return None


def parse_reference(text: str) -> dict | None:
    """Read a reference range cell and classify its shape."""
    if not text:
        return None

    candidate = text.strip()

    match = BETWEEN_RE.match(candidate)
    if match:
        low, high = _to_float(match.group(1)), _to_float(match.group(2))
        if low is not None and high is not None:
            if low > high:
                low, high = high, low
            return {"kind": "between", "low": low, "high": high, "text": candidate}

    match = LOWER_RE.match(candidate)
    if match:
        limit = _to_float(match.group(1))
        if limit is not None:
            return {"kind": "less_than", "low": None, "high": limit, "text": candidate}

    match = UPPER_RE.match(candidate)
    if match:
        limit = _to_float(match.group(1))
        if limit is not None:
            return {"kind": "greater_than", "low": limit, "high": None, "text": candidate}

    return None


def parse_value(text: str):
    """Pull the leading number out of a result cell."""
    if not text:
        return None

    candidate = text.strip()
    match = FIRST_NUMBER_RE.search(candidate)
    if not match:
        return None, ""

    value = _to_float(match.group(0))
    if value is None:
        return None, ""

    return value, candidate[match.end() :].strip()


def classify(value, reference: dict | None, comparator: dict | None = None) -> str:
    if reference is None:
        return "unknown"

    if value is not None:
        if reference["kind"] == "between":
            if value < reference["low"]:
                return "low"
            if value > reference["high"]:
                return "high"
            return "in_range"
        if reference["kind"] == "less_than":
            return "high" if value >= reference["high"] else "in_range"
        if reference["kind"] == "greater_than":
            return "low" if value <= reference["low"] else "in_range"
        return "unknown"

    if comparator and reference["kind"] == "between":
        limit = comparator["limit"]
        if comparator["op"] in ("<", "<=", "≤"):
            return "low" if limit <= reference["low"] else "unknown"
        if comparator["op"] in (">", ">=", "≥"):
            return "high" if limit >= reference["high"] else "unknown"

    return "unknown"


def _is_header(line: str) -> bool:
    lower = line.lower()
    has_name = any(word in lower for word in HEADER_WORDS)
    has_value = any(word in lower for word in VALUE_WORDS)
    has_range = any(word in lower for word in RANGE_WORDS)
    return has_name and (has_value or has_range)


def _is_noise(line: str) -> bool:
    lower = line.lower()
    if any(term in lower for term in SKIP_TERMS):
        return True
    digits = sum(character.isdigit() for character in line)
    return digits > 0 and digits / max(len(line), 1) > 0.5


def _clean_name(name: str) -> str:
    cleaned = re.sub(r"\s+", " ", name).strip(" \t.-*:|")
    return re.sub(r"^\d+[.)]\s*", "", cleaned)


def _split_cells(line: str) -> list[str]:
    parts = [part.strip() for part in re.split(r"\s{2,}|\t|\|", line) if part.strip()]
    return parts if len(parts) >= 2 else []


def _pick_result_index(rest: list[str]) -> int | None:
    for index, cell in enumerate(rest):
        if COMPARATOR_RE.match(cell):
            return index
        if parse_value(cell)[0] is not None:
            return index
    for index, cell in enumerate(rest):
        if parse_reference(cell) is None and re.search(r"[A-Za-z]", cell):
            return index
    return None


def _pick_reference_index(rest: list[str], result_index: int) -> int | None:
    for index in range(result_index + 1, len(rest)):
        if parse_reference(rest[index]):
            return index
    for index, cell in enumerate(rest):
        if index != result_index and parse_reference(cell):
            return index
    return None


def _is_metadata_line(line: str) -> bool:
    if ":" not in line:
        return False
    if any(parse_reference(cell.strip()) for cell in _split_cells(line)):
        return False
    head = line.split(":", 1)[0].strip().lower()
    return bool(head) and len(head) <= 30 and not re.search(rf"\d\s*(?:-|–|to|~)\s*\d", line)


def _parse_row(line: str) -> dict | None:
    cells = _split_cells(line)
    if len(cells) < 2:
        return None

    name = _clean_name(cells[0])
    if not name or len(name) < 2 or _is_noise(name) or ":" in name:
        return None

    rest = cells[1:]
    result_index = _pick_result_index(rest)
    if result_index is None:
        return None

    result_cell = rest[result_index]
    reference_index = _pick_reference_index(rest, result_index)
    reference = parse_reference(rest[reference_index]) if reference_index is not None else None

    comparator_match = COMPARATOR_RE.match(result_cell)
    comparator = None
    if comparator_match:
        comparator = {
            "op": comparator_match.group("op"),
            "limit": _to_float(comparator_match.group("limit")),
            "text": result_cell,
        }

    value, remainder = (None, "") if comparator else parse_value(result_cell)
    unit = remainder.lstrip(" ,").strip()
    if re.match(r"^/\s*\d", unit):
        unit = ""

    if not unit and reference_index is not None:
        unit = " ".join(
            cell
            for cell in rest[result_index + 1 : reference_index]
            if re.search(r"[A-Za-z/µ%]", cell)
        ).strip()

    if not unit and reference is None and len(rest) == 2:
        inline = INLINE_RE.match(result_cell)
        if inline:
            value = _to_float(inline.group("value"))
            unit = inline.group("unit").strip()
            reference = {
                "kind": "between",
                "low": _to_float(inline.group("low")),
                "high": _to_float(inline.group("high")),
                "text": f"{inline.group('low')} - {inline.group('high')}",
            }

    status = classify(value, reference, comparator)
    if status == "unknown" and value is None and not comparator and result_cell:
        status = "qualitative"

    return {
        "name": name,
        "raw": line.strip(),
        "value": value,
        "value_text": result_cell,
        "unit": unit,
        "range_text": reference["text"] if reference else "",
        "reference": reference,
        "comparator": comparator,
        "status": status,
    }


def parse_report(text: str) -> list[dict]:
    tests: list[dict] = []
    seen: set[str] = set()

    for line in (text or "").splitlines():
        if not line.strip() or _is_header(line) or _is_noise(line) or _is_metadata_line(line):
            continue

        row = _parse_row(line)
        if not row:
            continue

        key = re.sub(r"[^a-z0-9]", "", row["name"].lower())
        if not key or key in seen:
            continue

        seen.add(key)
        tests.append(row)

    return tests


def summarise(tests: list[dict]) -> dict:
    counts = {"in_range": 0, "low": 0, "high": 0, "unknown": 0, "qualitative": 0}
    for test in tests:
        counts[test["status"]] = counts.get(test["status"], 0) + 1

    flagged = [test for test in tests if test["status"] in ("low", "high")]

    return {
        "total": len(tests),
        "in_range": counts["in_range"],
        "low": counts["low"],
        "high": counts["high"],
        "unknown": counts["unknown"],
        "qualitative": counts["qualitative"],
        "flagged_total": counts["low"] + counts["high"],
        "flagged_names": [test["name"] for test in flagged],
    }