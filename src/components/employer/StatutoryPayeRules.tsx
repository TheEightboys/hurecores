import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';
import { statutoryRulesService } from '../../lib/services/statutoryRules.service';

/**
 * HURE Core – Kenya Statutory Payroll Rules
 * - Configures PAYE, NSSF, NHDF, SHA
 * - Integrated with Firebase via statutoryRulesService
 */

function clsx(...parts: (string | undefined | null | false)[]) {
    return parts.filter(Boolean).join(" ");
}

function KES({ value }: { value: number | string }) {
    const v = Number(value ?? 0);
    const formatted = v.toLocaleString("en-KE", {
        minimumFractionDigits: v % 1 ? 2 : 0,
        maximumFractionDigits: 2,
    });
    return <span className="tabular-nums">KES {formatted}</span>;
}

function Percent({ value, decimals = 2 }: { value: number | string, decimals?: number }) {
    const v = Number(value ?? 0);
    return (
        <span className="tabular-nums">
            {v.toFixed(decimals).replace(/\.00$/, "")}%
        </span>
    );
}

function Badge({ tone = "slate", children }: { tone?: "emerald" | "amber" | "rose" | "slate" | "indigo", children: React.ReactNode }) {
    const tones = {
        emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        amber: "bg-amber-50 text-amber-700 ring-amber-200",
        rose: "bg-rose-50 text-rose-700 ring-rose-200",
        slate: "bg-slate-50 text-slate-700 ring-slate-200",
        indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    };
    return (
        <span
            className={clsx(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                tones[tone] || tones.slate
            )}
        >
            {children}
        </span>
    );
}

function Card({ title, subtitle, right, children }: { title: string, subtitle?: string, right?: React.ReactNode, children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                    {subtitle ? (
                        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
                    ) : null}
                </div>
                {right ? <div className="shrink-0">{right}</div> : null}
            </div>
            <div className="px-6 py-5">{children}</div>
        </section>
    );
}

function Field({
    label,
    helper,
    prefix,
    suffix,
    value,
    onChange,
    type = "text",
    disabled,
    width = "w-full",
}: {
    label: string,
    helper?: string,
    prefix?: string,
    suffix?: string,
    value: string | number | undefined,
    onChange?: (val: string) => void,
    type?: string,
    disabled?: boolean,
    width?: string
}) {
    return (
        <label className={clsx("block", width)}>
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-900">{label}</span>
                {disabled ? <Badge tone="slate">Locked</Badge> : null}
            </div>
            {helper ? <p className="mt-1 text-xs text-slate-600">{helper}</p> : null}
            <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-slate-900/10">
                {prefix ? <span className="text-sm text-slate-500 mr-2">{prefix}</span> : null}
                <input
                    type={type}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange?.(e.target.value)}
                    className={clsx(
                        "w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400",
                        disabled && "cursor-not-allowed text-slate-500"
                    )}
                    placeholder="—"
                />
                {suffix ? <span className="text-sm text-slate-500 ml-2">{suffix}</span> : null}
            </div>
        </label>
    );
}

function InlineKeyValue({ label, value }: { label: string, value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-800">{label}</span>
            <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {value}
            </span>
        </div>
    );
}

function Modal({ open, title, subtitle, children, onClose }: { open: boolean, title: string, subtitle?: string, children: React.ReactNode, onClose: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
            <div
                className="absolute inset-0 bg-slate-900/40"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                        {subtitle ? (
                            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
                        ) : null}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

function Table({ columns, rows }: { columns: any[], rows: any[] }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse">
                <thead className="bg-slate-50">
                    <tr>
                        {columns.map((c) => (
                            <th
                                key={c.key}
                                className={clsx(
                                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600",
                                    c.align === "right" && "text-right"
                                )}
                            >
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {rows.map((r, idx) => (
                        <tr key={idx} className="border-t border-slate-200">
                            {columns.map((c) => (
                                <td
                                    key={c.key}
                                    className={clsx(
                                        "px-4 py-3 text-sm text-slate-800",
                                        c.align === "right" && "text-right",
                                        c.mono && "tabular-nums"
                                    )}
                                >
                                    {r[c.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function StatutoryPayeRules() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // Core editable values
    const [personalRelief, setPersonalRelief] = useState("2400");
    const [shaRate, setShaRate] = useState("2.75");
    const [nhdfRate, setNhdfRate] = useState("1.5");
    const [nssfTier1Limit, setNssfTier1Limit] = useState("6000");
    const [nssfTier2Limit, setNssfTier2Limit] = useState("18000");
    const [nssfEmployeeRate, setNssfEmployeeRate] = useState("6");
    const [nssfEmployerRate, setNssfEmployerRate] = useState("6");

    // UI state
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ tone: "emerald" | "amber", title: string, message: string } | null>(null);
    const [showAnnualBands, setShowAnnualBands] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // For mock preview
    const [sampleGross, setSampleGross] = useState("80000");
    const [taxableRule, setTaxableRule] = useState("gross"); // gross / custom (mock)
    const [nonTaxableAllowances, setNonTaxableAllowances] = useState("0");

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setLoading(true);
        try {
            const rules = await statutoryRulesService.getCurrentRules();
            if (rules) {
                setPersonalRelief(rules.personalRelief?.toString() || "2400");
                setShaRate((rules.shaRate * 100).toString());
                setNhdfRate((rules.nhdfRate * 100).toString());
                setNssfEmployeeRate((rules.nssfEmployeeRate * 100).toString());
                setNssfEmployerRate((rules.nssfEmployerRate * 100).toString());
                setNssfTier1Limit(rules.nssfTier1Limit?.toString() || "6000");
                setNssfTier2Limit(rules.nssfTier2Limit?.toString() || "18000");
            }
        } catch (err) {
            console.error("Error loading rules:", err);
        } finally {
            setLoading(false);
        }
    };

    const monthlyBands = useMemo(() => {
        // Derived from annual bands:
        // 288,000 @ 10% -> 24,000
        // 388,000 @ 25% -> 32,333.33
        // 6,000,000 @ 30% -> 500,000
        // 9,600,000 @ 32.5% -> 800,000
        // above -> 35%
        return [
            { order: 1, upper: 24000, rate: 10, source: "KRA" },
            { order: 2, upper: 32333.33, rate: 25, source: "KRA" },
            { order: 3, upper: 500000, rate: 30, source: "KRA" },
            { order: 4, upper: 800000, rate: 32.5, source: "KRA" },
            { order: 5, upper: Infinity, rate: 35, source: "KRA" },
        ];
    }, []);

    function computePayeMonthly(taxablePay: number) {
        // Progressive cumulative monthly PAYE (simplified; excludes other relief/exemptions).
        const bands = monthlyBands;
        let remaining = Math.max(0, taxablePay);
        let lastUpper = 0;
        let tax = 0;

        for (const b of bands) {
            const upper = b.upper;
            const bandWidth =
                upper === Infinity ? Infinity : Math.max(0, upper - lastUpper);
            const amountInBand = Math.min(remaining, bandWidth);
            if (amountInBand <= 0) break;
            tax += amountInBand * (b.rate / 100);
            remaining -= amountInBand;
            if (upper !== Infinity) lastUpper = upper;
            if (remaining <= 0) break;
        }

        // Apply personal relief AFTER tax calculation
        const relief = Number(personalRelief || 0);
        const netTax = Math.max(0, tax - relief);
        return { grossTax: tax, relief, netTax };
    }

    function computeNssfEmployee(gross: number) {
        const t1 = Number(nssfTier1Limit || 0);
        const t2 = Number(nssfTier2Limit || 0);
        const rate = Number(nssfEmployeeRate || 0) / 100;
        const pensionable = Math.min(gross, t2);
        const tier1 = Math.min(pensionable, t1);
        const tier2 = Math.max(0, Math.min(pensionable, t2) - t1);
        const contrib = (tier1 + tier2) * rate;
        return { contrib, pensionable };
    }

    function computeNssfEmployer(gross: number) {
        const t1 = Number(nssfTier1Limit || 0);
        const t2 = Number(nssfTier2Limit || 0);
        const rate = Number(nssfEmployerRate || 0) / 100;
        const pensionable = Math.min(gross, t2);
        const tier1 = Math.min(pensionable, t1);
        const tier2 = Math.max(0, Math.min(pensionable, t2) - t1);
        const contrib = (tier1 + tier2) * rate;
        return { contrib, pensionable };
    }

    function computeFlatPercent(gross: number, ratePercent: string | number) {
        const r = Number(ratePercent || 0) / 100;
        return Math.max(0, gross) * r;
    }

    const preview = useMemo(() => {
        const gross = Number(sampleGross || 0);
        const nonTaxable = Number(nonTaxableAllowances || 0);

        const taxable =
            taxableRule === "gross" ? gross : Math.max(0, gross - nonTaxable);

        const paye = computePayeMonthly(taxable);
        const sha = computeFlatPercent(gross, shaRate);
        const nhdf = computeFlatPercent(gross, nhdfRate);

        const nssfEmp = computeNssfEmployee(gross);
        const nssfEr = computeNssfEmployer(gross);

        const employeeDeductions = paye.netTax + sha + nhdf + nssfEmp.contrib;
        const netPay = gross - employeeDeductions;

        return {
            gross,
            taxable,
            paye,
            sha,
            nhdf,
            nssfEmp,
            nssfEr,
            employeeDeductions,
            netPay,
        };
    }, [
        sampleGross,
        taxableRule,
        nonTaxableAllowances,
        shaRate,
        nhdfRate,
        nssfTier1Limit,
        nssfTier2Limit,
        nssfEmployeeRate,
        nssfEmployerRate,
        personalRelief,
        monthlyBands,
    ]);

    async function handleSave() {
        if (!user) return;
        setSaving(true);
        setToast(null);

        try {
            await statutoryRulesService.updateRules(user.id, user.email, {
                personalRelief: Number(personalRelief),
                shaRate: Number(shaRate) / 100,
                nhdfRate: Number(nhdfRate) / 100,
                nssfEmployeeRate: Number(nssfEmployeeRate) / 100,
                nssfEmployerRate: Number(nssfEmployerRate) / 100,
                nssfTier1Limit: Number(nssfTier1Limit),
                nssfTier2Limit: Number(nssfTier2Limit),
                notes: "Updated from Statutory Rules Page"
            });

            setToast({
                tone: "emerald",
                title: "Saved",
                message: "Statutory rules updated successfully.",
            });
            setTimeout(() => setToast(null), 3500);
        } catch (err: any) {
            console.error("Failed to save rules:", err);
            setToast({
                tone: "amber", // Using amber for error as per badge tones available
                title: "Error",
                message: err.message || "Failed to update rules."
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleResetDefaults() {
        if (!user) return;
        if (!confirm("Are you sure you want to reset all statutory rules to system defaults?")) return;

        setSaving(true);
        try {
            const rules = await statutoryRulesService.revertToDefaults(user.id, user.email);
            setPersonalRelief(rules.personalRelief?.toString() || "2400");
            setShaRate((rules.shaRate * 100).toString());
            setNhdfRate((rules.nhdfRate * 100).toString());
            setNssfEmployeeRate((rules.nssfEmployeeRate * 100).toString());
            setNssfEmployerRate((rules.nssfEmployerRate * 100).toString());
            setNssfTier1Limit(rules.nssfTier1Limit?.toString() || "6000");
            setNssfTier2Limit(rules.nssfTier2Limit?.toString() || "18000");

            setToast({
                tone: "amber",
                title: "Defaults restored",
                message: "Values reset to typical Kenya defaults.",
            });
            setTimeout(() => setToast(null), 3500);
        } catch (err: any) {
            setToast({ tile: "Error", message: err.message, tone: "amber" } as any);
        } finally {
            setSaving(false);
        }
    }

    const payeRows = monthlyBands.map((b) => ({
        order: <span className="font-semibold text-slate-900">{b.order}</span>,
        upper:
            b.upper === Infinity ? (
                <span className="font-semibold text-slate-900">Above 800,000</span>
            ) : (
                <KES value={b.upper} />
            ),
        rate: <Percent value={b.rate} decimals={b.rate % 1 ? 1 : 0} />,
        source: <Badge tone="slate">{b.source}</Badge>,
    }));

    const annualRows = [
        { label: "10% on first", value: "KES 288,000" },
        { label: "25% on next", value: "KES 100,000" },
        { label: "30% on next", value: "KES 5,612,000" },
        { label: "32.5% on next", value: "KES 3,600,000" },
        { label: "35% above", value: "KES 9,600,000" },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 animate-in fade-in duration-500">
            {/* Top bar */}
            <div className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-6 sm:px-6">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">
                            Statutory Payroll Rules
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Manage Kenya statutory tax and contribution rates used in payroll calculations.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge tone="indigo">Global Settings</Badge>
                            <Badge tone="emerald">KRA-aligned bands</Badge>
                            <Badge tone="slate">Applies to all payroll runs</Badge>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            onClick={() => setShowPreview(true)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Preview Sample Payroll
                        </button>
                        <button
                            onClick={handleResetDefaults}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Reset to Defaults
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={clsx(
                                "rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors",
                                saving ? "cursor-not-allowed bg-slate-400" : "bg-slate-900 hover:bg-slate-800"
                            )}
                        >
                            {saving ? "Saving…" : "Save Statutory Rules"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast ? (
                <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Badge tone={toast.tone}>{toast.title}</Badge>
                                    <span className="text-sm font-medium text-slate-900">{toast.message}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setToast(null)}
                                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-50"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Content */}
            <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12">
                {/* Left column */}
                <div className="space-y-6 lg:col-span-8">
                    <Card
                        title="PAYE – Income Tax (KRA)"
                        subtitle="Progressive tax applied monthly, derived from annual KRA law."
                        right={<Badge tone="emerald">KRA-aligned</Badge>}
                    >
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                label="Personal Relief (Monthly)"
                                helper="Deducted from calculated PAYE (tax payable), not from taxable pay."
                                prefix="KES"
                                type="number"
                                value={personalRelief}
                                onChange={setPersonalRelief}
                            />

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">PAYE Bands</p>
                                        <p className="mt-1 text-xs text-slate-600">
                                            Bands are locked to reduce misconfiguration risk.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowAnnualBands(true)}
                                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        View Annual Bands
                                    </button>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Badge tone="slate">Cumulative</Badge>
                                    <Badge tone="slate">Monthly</Badge>
                                    <Badge tone="slate">Auto-derived</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5">
                            <Table
                                columns={[
                                    { key: "order", label: "Order", mono: true },
                                    { key: "upper", label: "Monthly Upper Limit (KES)" },
                                    { key: "rate", label: "Tax Rate", align: "right", mono: true },
                                    { key: "source", label: "Source", align: "right" },
                                ]}
                                rows={payeRows}
                            />
                            <p className="mt-3 text-xs text-slate-600">
                                These bands are derived from annual KRA tax law and applied cumulatively on monthly taxable pay.
                                The last band is open-ended (infinity).
                            </p>
                        </div>
                    </Card>

                    <Card
                        title="Statutory Contributions – Employee"
                        subtitle="Deductions that reduce employee net pay."
                        right={<Badge tone="slate">Payslip items</Badge>}
                    >
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                label="Social Health Authority (SHA) Contribution (%)"
                                helper="Applied to gross pay. (Formerly NHIF / SHIF.)"
                                suffix="%"
                                type="number"
                                value={shaRate}
                                onChange={setShaRate}
                            />
                            <Field
                                label="National Housing Development Fund (NHDF) Contribution (%)"
                                helper="Applied to gross pay."
                                suffix="%"
                                type="number"
                                value={nhdfRate}
                                onChange={setNhdfRate}
                            />
                        </div>

                        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">NSSF – Employee Contribution</p>
                                    <p className="mt-1 text-xs text-slate-600">
                                        Employee contributes 6% up to the tier limits (pensionable salary cap).
                                    </p>
                                </div>
                                <Badge tone="slate">Tiered</Badge>
                            </div>

                            <div className="mt-4 grid gap-5 sm:grid-cols-2">
                                <Field
                                    label="Employee Rate"
                                    suffix="%"
                                    type="number"
                                    value={nssfEmployeeRate}
                                    onChange={setNssfEmployeeRate}
                                />
                                <div className="grid gap-3">
                                    <InlineKeyValue
                                        label="Max Pensionable Salary"
                                        value={<KES value={Number(nssfTier2Limit || 0)} />}
                                    />
                                    <InlineKeyValue label="Tier Structure" value="Tier I + Tier II" />
                                </div>
                                <Field
                                    label="Tier I Limit (KES)"
                                    prefix="KES"
                                    type="number"
                                    value={nssfTier1Limit}
                                    onChange={setNssfTier1Limit}
                                />
                                <Field
                                    label="Tier II Limit (KES)"
                                    prefix="KES"
                                    type="number"
                                    value={nssfTier2Limit}
                                    onChange={setNssfTier2Limit}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card
                        title="Statutory Contributions – Employer"
                        subtitle="Employer contributions do not reduce employee net pay (reporting & accounting)."
                        right={<Badge tone="slate">Employer-only</Badge>}
                    >
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">NSSF – Employer Contribution</p>
                                    <p className="mt-1 text-xs text-slate-600">
                                        Employer matches NSSF (commonly 6%) within the same tier limits.
                                    </p>
                                </div>
                                <Badge tone="slate">Matches employee</Badge>
                            </div>

                            <div className="mt-4 grid gap-5 sm:grid-cols-2">
                                <Field
                                    label="Employer Rate"
                                    suffix="%"
                                    type="number"
                                    value={nssfEmployerRate}
                                    onChange={setNssfEmployerRate}
                                />
                                <div className="grid gap-3">
                                    <InlineKeyValue
                                        label="Uses Tier I Limit"
                                        value={<KES value={Number(nssfTier1Limit || 0)} />}
                                    />
                                    <InlineKeyValue
                                        label="Uses Tier II Limit"
                                        value={<KES value={Number(nssfTier2Limit || 0)} />}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card
                        title="Calculation Rules & Safeguards"
                        subtitle="Defines taxable pay and payroll calculation order to prevent ambiguity."
                        right={<Badge tone="slate">Explainer</Badge>}
                    >
                        <div className="grid gap-5 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">Taxable Pay Definition</p>
                                <p className="mt-1 text-xs text-slate-600">
                                    Used for PAYE calculation only. Payroll exports and audits rely on this.
                                </p>

                                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                                    <pre className="whitespace-pre-wrap text-xs text-slate-800">{`Taxable Pay =\nGross Pay\n– Non-taxable allowances (flagged)\n– Approved exemptions/reliefs`}</pre>
                                </div>

                                <div className="mt-3">
                                    <label className="text-xs font-semibold text-slate-600">In this mock, taxable pay is:</label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setTaxableRule("gross")}
                                            className={clsx(
                                                "rounded-xl px-3 py-2 text-sm font-semibold",
                                                taxableRule === "gross"
                                                    ? "bg-slate-900 text-white"
                                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                            )}
                                        >
                                            Gross Pay
                                        </button>
                                        <button
                                            onClick={() => setTaxableRule("custom")}
                                            className={clsx(
                                                "rounded-xl px-3 py-2 text-sm font-semibold",
                                                taxableRule === "custom"
                                                    ? "bg-slate-900 text-white"
                                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                            )}
                                        >
                                            Gross − Non-taxable
                                        </button>
                                    </div>

                                    {taxableRule === "custom" ? (
                                        <div className="mt-3">
                                            <Field
                                                label="Non-taxable Allowances (KES)"
                                                helper="Mock only: subtract this from gross to get taxable pay."
                                                prefix="KES"
                                                type="number"
                                                value={nonTaxableAllowances}
                                                onChange={setNonTaxableAllowances}
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-sm font-semibold text-slate-900">Calculation Order (Locked)</p>
                                <p className="mt-1 text-xs text-slate-600">
                                    Display-only. Keeps payroll behavior consistent across the system.
                                </p>

                                <ol className="mt-4 space-y-2">
                                    {[
                                        "Calculate Gross Pay",
                                        "Determine Taxable Pay",
                                        "Apply PAYE cumulatively",
                                        "Apply Personal Relief",
                                        "Deduct Employee Statutory Contributions",
                                        "Compute Net Pay",
                                        "Add Employer Contributions (reporting only)",
                                    ].map((step, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                                        >
                                            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm text-slate-800">{step}</span>
                                        </li>
                                    ))}
                                </ol>

                                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                                    <p className="text-xs text-slate-600">
                                        Safeguard: The final PAYE band is always open-ended. Admins cannot set “0 = infinity”.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right column */}
                <aside className="space-y-6 lg:col-span-4">
                    <Card title="Quick Summary" subtitle="A high-level view of what these rules affect." right={<Badge tone="slate">Help</Badge>}>
                        <div className="space-y-3">
                            <InlineKeyValue label="PAYE Bands" value={<span className="text-slate-900">Locked (KRA)</span>} />
                            <InlineKeyValue label="Personal Relief" value={<KES value={Number(personalRelief || 0)} />} />
                            <InlineKeyValue label="SHA" value={<Percent value={Number(shaRate || 0)} />} />
                            <InlineKeyValue label="NHDF" value={<Percent value={Number(nhdfRate || 0)} />} />
                            <InlineKeyValue
                                label="NSSF (Emp/Er)"
                                value={
                                    <span className="tabular-nums">
                                        {Number(nssfEmployeeRate || 0).toFixed(0)}% / {Number(nssfEmployerRate || 0).toFixed(0)}%
                                    </span>
                                }
                            />
                            <InlineKeyValue
                                label="Tier Limits"
                                value={
                                    <span className="tabular-nums">
                                        <KES value={Number(nssfTier1Limit || 0)} /> / <KES value={Number(nssfTier2Limit || 0)} />
                                    </span>
                                }
                            />
                        </div>
                    </Card>

                    <Card title="Notes for Implementation" subtitle="Developer guidance embedded in UI for fewer mistakes.">
                        <ul className="space-y-3 text-sm text-slate-700">
                            <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <span className="font-semibold text-slate-900">Relief</span> reduces <span className="font-semibold">tax payable</span>, not taxable income.
                            </li>
                            <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                Separate <span className="font-semibold text-slate-900">employee deductions</span> from <span className="font-semibold text-slate-900">employer contributions</span> in payslips and exports.
                            </li>
                            <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                PAYE bands should be stored as <span className="font-semibold text-slate-900">annual law</span> and derived monthly (or clearly labeled as derived).
                            </li>
                        </ul>
                    </Card>
                </aside>
            </div>

            <Modal
                open={showAnnualBands}
                onClose={() => setShowAnnualBands(false)}
                title="Annual PAYE Bands (KRA)"
                subtitle="Reference view. Monthly bands shown on the page are derived from these."
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    {annualRows.map((r, i) => (
                        <React.Fragment key={i}>
                            <InlineKeyValue label={r.label} value={r.value} />
                        </React.Fragment>
                    ))}
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-600">
                        Admin action: “Recalculate Monthly Bands” can re-derive the monthly thresholds from annual bands if tax law changes.
                    </p>
                </div>
            </Modal>

            <Modal
                open={showPreview}
                onClose={() => setShowPreview(false)}
                title="Preview Sample Payroll"
                subtitle="Quick sanity-check using the current statutory rule settings."
            >
                <div className="grid gap-5 lg:grid-cols-2">
                    <div className="space-y-4">
                        <Field
                            label="Sample Gross Pay (KES)"
                            prefix="KES"
                            type="number"
                            value={sampleGross}
                            onChange={setSampleGross}
                        />

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-900">Computed Totals</p>
                            <p className="mt-1 text-xs text-slate-600">
                                This is a simplified preview (for UX validation). Final payroll may include allowances, benefits, reliefs, and other deductions.
                            </p>

                            <div className="mt-3 space-y-3">
                                <InlineKeyValue label="Taxable Pay" value={<KES value={preview.taxable} />} />
                                <InlineKeyValue label="PAYE (before relief)" value={<KES value={preview.paye.grossTax} />} />
                                <InlineKeyValue label="Personal Relief" value={<KES value={preview.paye.relief} />} />
                                <InlineKeyValue label="PAYE (after relief)" value={<KES value={preview.paye.netTax} />} />
                                <InlineKeyValue label="SHA" value={<KES value={preview.sha} />} />
                                <InlineKeyValue label="NHDF" value={<KES value={preview.nhdf} />} />
                                <InlineKeyValue label="NSSF (Employee)" value={<KES value={preview.nssfEmp.contrib} />} />
                                <InlineKeyValue label="Total Employee Deductions" value={<KES value={preview.employeeDeductions} />} />
                                <InlineKeyValue label="Net Pay" value={<KES value={preview.netPay} />} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-sm font-semibold text-slate-900">Employer Reporting</p>
                            <p className="mt-1 text-xs text-slate-600">
                                Employer contributions do not reduce net pay, but must be reported and exported.
                            </p>
                            <div className="mt-3 space-y-3">
                                <InlineKeyValue label="NSSF (Employer)" value={<KES value={preview.nssfEr.contrib} />} />
                                <InlineKeyValue label="Pensionable Salary Cap" value={<KES value={preview.nssfEr.pensionable} />} />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-900">Preview Checklist</p>
                            <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                <li className="flex gap-2">
                                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-white ring-1 ring-slate-200">✓</span>
                                    PAYE uses progressive bands + relief after tax
                                </li>
                                <li className="flex gap-2">
                                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-white ring-1 ring-slate-200">✓</span>
                                    SHA and NHDF apply to gross pay
                                </li>
                                <li className="flex gap-2">
                                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-white ring-1 ring-slate-200">✓</span>
                                    NSSF respects tier limits and splits employee vs employer
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Modal>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <p className="text-xs text-slate-600">
                        Last updated: <span className="font-medium text-slate-900">{(new Date()).toLocaleDateString()}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowPreview(true)}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Preview
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={clsx(
                                "rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors",
                                saving ? "cursor-not-allowed bg-slate-400" : "bg-slate-900 hover:bg-slate-800"
                            )}
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
