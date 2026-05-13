/**
 * Estimation report email.
 *
 * Rendered server-side via react-email and delivered through Resend.
 * Design mirrors the website (Lightbase dark theme with warm-glow accent).
 *
 * Important: email clients have inconsistent CSS support, so all styles are
 * inlined and we stick to table-based layouts + system fonts.
 */

import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import type { ProjectEstimate } from "@/lib/estimation/estimate";
import type { ProjectStepValues } from "@/lib/estimation/schema";
import { brand, fonts, radii, spacing } from "./styles";

export interface EstimationReportProps {
  project: ProjectStepValues;
  estimate: ProjectEstimate;
  locale: "fr" | "en";
  hqOseEligible: boolean;
  /** Public base URL for the logo (e.g. https://lightpro.lightbase.ca). */
  baseUrl?: string;
}

const T = (locale: "fr" | "en") => ({
  preview:
    locale === "en"
      ? "Your Lightpro OM estimation — two scenarios"
      : "Votre estimation Lightpro OM — deux scénarios",
  reportTitle:
    locale === "en" ? "Estimation report" : "Rapport d'estimation",
  hello: locale === "en" ? "Hello" : "Bonjour",
  intro:
    locale === "en"
      ? "Here is the budgetary estimate for your sports lighting project. Two scenarios are presented: a 1-for-1 LED replacement and a configuration that meets the IES RP-6 standard."
      : "Voici l'estimation budgétaire pour votre projet d'éclairage sportif. Deux scénarios sont présentés : un remplacement 1 pour 1 en LED et une configuration conforme à la norme IES RP-6.",
  scenarioA:
    locale === "en"
      ? "Scenario A — 1-for-1 replacement"
      : "Scénario A — Remplacement 1 pour 1",
  scenarioASubtitle:
    locale === "en"
      ? "Direct LED replacement of existing fixtures"
      : "Remplacement direct de l'existant en LED",
  scenarioB:
    locale === "en"
      ? "Scenario B — IES RP-6 standard"
      : "Scénario B — Conformité IES RP-6",
  scenarioBSubtitle:
    locale === "en"
      ? "Per IES RP-6 standard for the activity"
      : "Selon la norme IES RP-6 pour l'activité",
  delta: locale === "en" ? "Difference" : "Différence",
  luminaires: locale === "en" ? "Luminaires" : "Luminaires",
  poles: locale === "en" ? "Poles" : "Fûts",
  newPoles: locale === "en" ? "New poles" : "Nouveaux fûts",
  fieldsHeader: locale === "en" ? "Per-terrain detail" : "Détail par terrain",
  surface: locale === "en" ? "Surface" : "Surface",
  iesClass: locale === "en" ? "IES Class" : "Classe IES",
  reference: locale === "en" ? "Reference" : "Référence",
  targetLux: locale === "en" ? "Target" : "Cible",
  goLabel:
    locale === "en"
      ? "Existing infrastructure sufficient"
      : "Infrastructure suffisante",
  nogoLabel: locale === "en" ? "Study required" : "Étude requise",
  noStandard:
    locale === "en"
      ? "No standard available — 1:1 photometric study required."
      : "Norme non disponible — photométrie 1:1 requise.",
  subtotal: locale === "en" ? "Subtotal" : "Sous-total",
  breakdownLuminaires: locale === "en" ? "LP luminaires" : "Luminaires LP",
  breakdownVisors: locale === "en" ? "Visors" : "Visières",
  breakdownBrackets: locale === "en" ? "Brackets" : "Brackets",
  breakdownControls: locale === "en" ? "Control system" : "Système de contrôle",
  breakdownCrossarms:
    locale === "en" ? "Crossarm replacement" : "Remplacement traverses",
  breakdownNewPoles: locale === "en" ? "New poles" : "Ajout de fûts",
  breakdownInstallation: locale === "en" ? "Installation" : "Installation",
  hqOseNote:
    locale === "en"
      ? "Eligible for the HQ-OSE 5.1 subsidy program — applicable rebate to be confirmed."
      : "Admissible au programme HQ-OSE 5.1 — montant de subvention à confirmer.",
  disclaimerLine1:
    locale === "en"
      ? "A detailed photometric study is required. Contact us to schedule a site visit (to perform the study) and receive a more accurate estimate."
      : "Une étude photométrique précise est requise. Contactez-nous pour planifier une visite (afin de réaliser l'étude) et obtenir une estimation plus précise.",
  disclaimerLine2:
    locale === "en"
      ? "We can also reach out to your local electrician for guidance on the budgetary evaluation."
      : "Nous pouvons également communiquer avec votre électricien local pour une orientation dans l'évaluation budgétaire.",
  footer:
    locale === "en"
      ? "Lightbase — Montréal, Québec, Canada"
      : "Lightbase — Montréal, Québec, Canada",
  rights:
    locale === "en"
      ? "Lightpro OM is a registered trademark of Lightbase."
      : "Lightpro OM est une marque déposée de Lightbase.",
});

function fmtCad(n: number, locale: "fr" | "en"): string {
  return new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtNumber(n: number, locale: "fr" | "en"): string {
  return new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA").format(
    Math.round(n),
  );
}

export function EstimationReport({
  project,
  estimate,
  locale,
  hqOseEligible,
  baseUrl = "https://lightpro.lightbase.ca",
}: EstimationReportProps) {
  const t = T(locale);
  const hasB = estimate.totalScenarioB !== null;
  const totalB = estimate.totalScenarioB ?? estimate.totalScenarioA;
  const delta = estimate.deltaCost ?? 0;

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: brand.ink,
          color: brand.white,
          fontFamily: fonts.sans,
          fontSize: "14px",
          lineHeight: "1.55",
        }}
      >
        <Container
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            padding: `${spacing.xl} ${spacing.lg}`,
          }}
        >
          {/* ─── Header ─── */}
          <Section style={{ paddingBottom: spacing.lg }}>
            <Row>
              <Column>
                <Img
                  src={`${baseUrl}/lightbase/logo-wordmark.png`}
                  alt="Lightbase"
                  width="120"
                  height="24"
                  style={{ display: "block" }}
                />
              </Column>
              <Column align="right">
                <Text
                  style={{
                    margin: 0,
                    color: brand.fog,
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Lightpro OM
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={{ borderColor: brand.ink3, margin: `0 0 ${spacing.xl}` }} />

          {/* ─── Greeting & intro ─── */}
          <Section>
            <Heading
              as="h1"
              style={{
                margin: 0,
                color: brand.white,
                fontSize: "28px",
                lineHeight: "1.15",
                letterSpacing: "-0.02em",
                fontWeight: 600,
              }}
            >
              {t.reportTitle}
            </Heading>
            <Text style={{ color: brand.fog, margin: `${spacing.xs} 0 0` }}>
              {t.hello} {project.contactName} — {project.municipality}
            </Text>
            <Text
              style={{
                color: brand.mist,
                margin: `${spacing.md} 0 0`,
                fontSize: "14px",
              }}
            >
              {t.intro}
            </Text>
          </Section>

          {/* ─── Totals card ─── */}
          <Section
            style={{
              marginTop: spacing.xl,
              backgroundColor: brand.ink2,
              borderRadius: radii.lg,
              border: `1px solid ${brand.ink3}`,
              padding: spacing.lg,
            }}
          >
            <Row>
              <Column style={{ width: "33%", verticalAlign: "top" }}>
                <TotalBlock
                  label={t.scenarioA}
                  value={fmtCad(estimate.totalScenarioA, locale)}
                  hint={t.scenarioASubtitle}
                  accent={false}
                />
              </Column>
              <Column style={{ width: "33%", verticalAlign: "top" }}>
                <TotalBlock
                  label={t.scenarioB}
                  value={hasB ? fmtCad(totalB, locale) : "—"}
                  hint={hasB ? t.scenarioBSubtitle : t.noStandard}
                  accent={hasB}
                />
              </Column>
              <Column style={{ width: "33%", verticalAlign: "top" }}>
                <TotalBlock
                  label={t.delta}
                  value={
                    hasB
                      ? `${delta >= 0 ? "+" : "−"} ${fmtCad(Math.abs(delta), locale)}`
                      : "—"
                  }
                  hint=""
                  accent={false}
                  tone={delta > 0 ? "amber" : delta < 0 ? "success" : undefined}
                />
              </Column>
            </Row>
          </Section>

          {/* ─── Per-terrain ─── */}
          <Section style={{ marginTop: spacing.xl }}>
            <Heading
              as="h2"
              style={{
                margin: 0,
                color: brand.white,
                fontSize: "18px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {t.fieldsHeader}
            </Heading>
          </Section>

          {estimate.fields.map((field) => (
            <FieldBlock
              key={field.fieldId}
              field={field}
              locale={locale}
              t={t}
            />
          ))}

          {/* ─── Disclaimer ─── */}
          <Section
            style={{
              marginTop: spacing.xxl,
              padding: spacing.md,
              backgroundColor: brand.ink2,
              borderRadius: radii.md,
              border: `1px solid ${brand.ink3}`,
            }}
          >
            <Text
              style={{
                margin: 0,
                color: brand.mist,
                fontSize: "12px",
                lineHeight: "1.6",
              }}
            >
              {t.disclaimerLine1}
            </Text>
            <Text
              style={{
                margin: `${spacing.sm} 0 0`,
                color: brand.mist,
                fontSize: "12px",
                lineHeight: "1.6",
              }}
            >
              {t.disclaimerLine2}
            </Text>
          </Section>

          {/* ─── Footer ─── */}
          <Section style={{ marginTop: spacing.xl, textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                color: brand.fog,
                fontSize: "11px",
              }}
            >
              {t.footer}
            </Text>
            <Text
              style={{
                margin: `${spacing.xs} 0 0`,
                color: brand.ink4,
                fontSize: "10px",
              }}
            >
              {t.rights} ·{" "}
              <Link
                href={baseUrl}
                style={{ color: brand.glow, textDecoration: "none" }}
              >
                lightbase.ca
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────

function TotalBlock({
  label,
  value,
  hint,
  accent,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  accent: boolean;
  tone?: "amber" | "success";
}) {
  const color =
    tone === "amber" ? brand.amber : tone === "success" ? brand.success : brand.white;
  return (
    <>
      <Text
        style={{
          margin: 0,
          color: brand.fog,
          fontSize: "10px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          margin: `${spacing.xs} 0 0`,
          color: accent ? brand.glow : color,
          fontSize: "22px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </Text>
      {hint ? (
        <Text
          style={{
            margin: `${spacing.xs} 0 0`,
            color: brand.fog,
            fontSize: "10px",
            lineHeight: "1.4",
          }}
        >
          {hint}
        </Text>
      ) : null}
    </>
  );
}

function FieldBlock({
  field,
  locale,
  t,
}: {
  field: ProjectEstimate["fields"][number];
  locale: "fr" | "en";
  t: ReturnType<typeof T>;
}) {
  return (
    <Section
      style={{
        marginTop: spacing.lg,
        backgroundColor: brand.ink2,
        border: `1px solid ${brand.ink3}`,
        borderRadius: radii.lg,
        padding: spacing.lg,
      }}
    >
      <Row>
        <Column>
          <Heading
            as="h3"
            style={{
              margin: 0,
              color: brand.white,
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            {field.fieldName}
          </Heading>
          <Text
            style={{
              margin: `${spacing.xs} 0 0`,
              color: brand.fog,
              fontSize: "12px",
            }}
          >
            {field.sport} · {field.iesClass.replace("CLASS_", "Class ")} ·{" "}
            {fmtNumber(field.surfaceM2, locale)} m²
          </Text>
        </Column>
        <Column align="right">
          {field.standard ? (
            <span
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: radii.full,
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                backgroundColor:
                  field.standard.goNoGo === "GO"
                    ? brand.success
                    : brand.destructive,
                color: brand.white,
              }}
            >
              {field.standard.goNoGo === "GO" ? t.goLabel : t.nogoLabel}
            </span>
          ) : null}
        </Column>
      </Row>

      <Hr style={{ borderColor: brand.ink3, margin: `${spacing.md} 0` }} />

      {/* Two columns: Scenario A & B */}
      <Row>
        <Column style={{ width: "50%", verticalAlign: "top", paddingRight: "8px" }}>
          <ScenarioMini
            title={t.scenarioA}
            subtitle={t.scenarioASubtitle}
            qtyLuminaires={field.scenarioA.qtyLuminaires}
            qtyPoles={field.scenarioA.qtyPolesExisting}
            qtyNewPoles={0}
            variant={field.scenarioA.variant}
            subtotal={field.scenarioA.subtotal}
            breakdown={field.scenarioA}
            locale={locale}
            t={t}
            accent={false}
          />
        </Column>
        <Column style={{ width: "50%", verticalAlign: "top", paddingLeft: "8px" }}>
          {field.scenarioB && field.standard ? (
            <ScenarioMini
              title={t.scenarioB}
              subtitle={`${t.targetLux} ${field.standard.targetLux} lux`}
              qtyLuminaires={field.scenarioB.qtyLuminaires}
              qtyPoles={field.standard.existingPoles}
              qtyNewPoles={field.scenarioB.qtyPolesNew}
              variant={field.scenarioB.variant}
              subtotal={field.scenarioB.subtotal}
              breakdown={field.scenarioB}
              locale={locale}
              t={t}
              accent
              reference={field.standard.referenceLabel}
            />
          ) : (
            <div
              style={{
                border: `1px dashed ${brand.ink3}`,
                borderRadius: radii.md,
                padding: spacing.md,
                color: brand.fog,
                fontSize: "12px",
              }}
            >
              <Text style={{ margin: 0, color: brand.fog }}>
                {t.noStandard}
              </Text>
            </div>
          )}
        </Column>
      </Row>
    </Section>
  );
}

function ScenarioMini({
  title,
  subtitle,
  qtyLuminaires,
  qtyPoles,
  qtyNewPoles,
  variant,
  subtotal,
  breakdown,
  locale,
  t,
  accent,
  reference,
}: {
  title: string;
  subtitle: string;
  qtyLuminaires: number;
  qtyPoles: number;
  qtyNewPoles: number;
  variant: string;
  subtotal: number;
  breakdown: ProjectEstimate["fields"][number]["scenarioA"];
  locale: "fr" | "en";
  t: ReturnType<typeof T>;
  accent: boolean;
  reference?: string;
}) {
  const rows: { label: string; value: number }[] = [
    { label: t.breakdownLuminaires, value: breakdown.luminairesCost },
    { label: t.breakdownVisors, value: breakdown.visorsCost },
    { label: t.breakdownBrackets, value: breakdown.bracketsCost },
    { label: t.breakdownControls, value: breakdown.controlsCost },
  ];
  if (breakdown.crossarmsCost > 0) {
    rows.push({
      label: t.breakdownCrossarms,
      value: breakdown.crossarmsCost,
    });
  }
  if (breakdown.newPolesCost > 0) {
    rows.push({
      label: t.breakdownNewPoles,
      value: breakdown.newPolesCost,
    });
  }
  rows.push({
    label: t.breakdownInstallation,
    value: breakdown.installationCost,
  });

  return (
    <div
      style={{
        border: `1px solid ${accent ? brand.ink4 : brand.ink3}`,
        backgroundColor: accent ? brand.ink : brand.ink2,
        borderRadius: radii.md,
        padding: spacing.md,
      }}
    >
      <Text
        style={{
          margin: 0,
          color: brand.fog,
          fontSize: "10px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          margin: `${spacing.xs} 0 0`,
          color: brand.cloud,
          fontSize: "11px",
        }}
      >
        {subtitle}
      </Text>

      <Row style={{ marginTop: spacing.md }}>
        <Column style={{ width: "50%" }}>
          <StatMini
            label={t.luminaires}
            value={`${qtyLuminaires}`}
            sub={`LP ${variant}`}
          />
        </Column>
        <Column style={{ width: "50%" }}>
          <StatMini
            label={t.poles}
            value={
              qtyNewPoles > 0 ? `${qtyPoles} + ${qtyNewPoles}` : `${qtyPoles}`
            }
            sub={qtyNewPoles > 0 ? `${t.newPoles}: ${qtyNewPoles}` : undefined}
          />
        </Column>
      </Row>

      {reference ? (
        <Text
          style={{
            margin: `${spacing.sm} 0 0`,
            color: brand.fog,
            fontSize: "11px",
          }}
        >
          {t.reference}: {reference}
        </Text>
      ) : null}

      <Hr style={{ borderColor: brand.ink3, margin: `${spacing.md} 0` }} />

      {rows.map((r) => (
        <Row key={r.label} style={{ marginBottom: "4px" }}>
          <Column>
            <Text
              style={{
                margin: 0,
                color: brand.fog,
                fontSize: "12px",
              }}
            >
              {r.label}
            </Text>
          </Column>
          <Column align="right">
            <Text
              style={{
                margin: 0,
                color: brand.cloud,
                fontSize: "12px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {fmtCad(r.value, locale)}
            </Text>
          </Column>
        </Row>
      ))}

      <Hr style={{ borderColor: brand.ink3, margin: `${spacing.md} 0 ${spacing.sm}` }} />

      <Row>
        <Column>
          <Text
            style={{
              margin: 0,
              color: brand.white,
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {t.subtotal}
          </Text>
        </Column>
        <Column align="right">
          <Text
            style={{
              margin: 0,
              color: accent ? brand.glow : brand.white,
              fontSize: "18px",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.01em",
            }}
          >
            {fmtCad(subtotal, locale)}
          </Text>
        </Column>
      </Row>
    </div>
  );
}

function StatMini({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <>
      <Text
        style={{
          margin: 0,
          color: brand.fog,
          fontSize: "10px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          margin: "2px 0 0",
          color: brand.white,
          fontSize: "20px",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Text>
      {sub ? (
        <Text
          style={{
            margin: 0,
            color: brand.fog,
            fontSize: "10px",
          }}
        >
          {sub}
        </Text>
      ) : null}
    </>
  );
}

export default EstimationReport;
