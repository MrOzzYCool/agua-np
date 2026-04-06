"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DIAS_SEMANA = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }

function toISO(d: Date) {
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;
}
function toDDMMYYYY(d: Date) {
  return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`;
}
function parseDDMMYYYY(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(+yyyy, +mm - 1, +dd);
  if (d.getFullYear() === +yyyy && d.getMonth() === +mm - 1 && d.getDate() === +dd) return d;
  return null;
}

// Auto-insert slashes: "03" -> "03/", "03/04" -> "03/04/"
function formatInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
}

type Props = { name: string; defaultValue?: string; required?: boolean };

export default function DatePicker({ name, defaultValue, required }: Props) {
  const today = new Date();
  const initial = defaultValue ? new Date(defaultValue + "T00:00:00") : today;

  const [selected, setSelected] = useState<Date>(initial);
  const [text, setText] = useState(toDDMMYYYY(initial));
  const [error, setError] = useState("");
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatInput(e.target.value);
    setText(formatted);
    if (formatted.length === 10) {
      const parsed = parseDDMMYYYY(formatted);
      if (parsed) {
        setSelected(parsed);
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
        setError("");
      } else {
        setError("Fecha inválida");
      }
    } else {
      setError("");
    }
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    setSelected(d);
    setText(toDDMMYYYY(d));
    setError("");
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDay(viewYear, viewMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const isSel = (d: number) => selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === d;
  const isToday = (d: number) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;

  return (
    <div ref={wrapRef} className="relative">
      <input type="hidden" name={name} value={toISO(selected)} />
      <div className="flex">
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="DD/MM/AAAA"
          maxLength={10}
          className="flex-1 px-4 py-2.5 border border-slate-300 border-r-0 rounded-l-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-slate-900 text-sm font-mono placeholder-slate-400"
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="px-3 py-2.5 border border-slate-300 rounded-r-xl bg-sky-50 hover:bg-sky-100 transition"
        >
          <Calendar className="w-4 h-4 text-sky-500" />
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}

      {open && (
        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-sm font-semibold text-slate-800">{MESES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-[11px] font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) =>
              day === null ? <div key={`e-${i}`} /> : (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition flex items-center justify-center mx-auto ${
                    isSel(day) ? "bg-sky-500 text-white shadow-sm"
                    : isToday(day) ? "bg-sky-50 text-sky-600 font-bold"
                    : "text-slate-700 hover:bg-sky-100"
                  }`}
                >{day}</button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
