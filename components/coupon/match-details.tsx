import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/stryktips/format";
import { SIGNS, tally, type MatchAnalysis } from "@/lib/stryktips/model";
import type { CouponMatch, FormResult, TeamForm, Triple } from "@/lib/stryktips/types";
import { cn } from "@/lib/utils";

const RESULT_WORD: Record<FormResult, string> = { V: "vinst", O: "oavgjort", F: "förlust", "": "ej ifylld" };

// dark: variants override the outline button's own dark-mode background
const RESULT_STYLE: Record<FormResult, string> = {
  "": "",
  V: "border-[#56657b] dark:bg-[#56657b] dark:hover:bg-[#56657b]/80",
  O: "border-secondary dark:bg-secondary dark:hover:bg-secondary/80",
  F: "border-2 border-ink-2",
};

type MatchDetailsProps = {
  match: CouponMatch;
  form: TeamForm;
  analysis: MatchAnalysis;
  onCycleResult: (side: keyof TeamForm, index: number) => void;
};

export function MatchDetails({ match, form, analysis, onCycleResult }: MatchDetailsProps) {
  const basis = analysis.form && analysis.meetings ? "oddsen, formen och de inbördes mötena" : "oddsen och formen";

  return (
    <div className="ml-12 flex flex-wrap gap-x-10 gap-y-7 rounded-xl border bg-card px-6 py-5.5">
      <div className="flex flex-[1_1_300px] flex-col gap-3.5">
        <h3 className="text-base font-semibold">Form, äldst till vänster</h3>
        <FormSeries title={`${match.home} hemma`} results={form.home} onCycle={(i) => onCycleResult("home", i)} />
        <FormSeries title={`${match.away} borta`} results={form.away} onCycle={(i) => onCycleResult("away", i)} />
      </div>

      <div className="flex flex-[1_1_280px] flex-col gap-2.5">
        <h3 className="text-base font-semibold">Sannolikhet</h3>
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-0">
                <span className="sr-only">Tecken</span>
              </TableHead>
              <TableHead className="text-right text-[12.5px] font-medium text-muted-foreground">Oddsen</TableHead>
              <TableHead className="text-right text-[12.5px] font-medium text-muted-foreground">Form</TableHead>
              <TableHead className="text-right text-[12.5px] font-medium text-muted-foreground">Möten</TableHead>
              <TableHead className="pr-0 text-right text-[12.5px] font-medium text-muted-foreground">
                Sammanvägd
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SIGNS.map((sign, i) => (
              <TableRow key={sign} className="hover:bg-transparent">
                <TableHead scope="row" className="pl-0 text-base font-extrabold text-foreground">
                  {sign}
                </TableHead>
                <TableCell className="text-right text-ink-2">{percent(match.odds, i)}</TableCell>
                <TableCell className="text-right text-ink-2">{percent(analysis.form, i)}</TableCell>
                <TableCell className="text-right text-ink-2">{percent(analysis.meetings, i)}</TableCell>
                <TableCell className="pr-0 text-right font-bold">{percent(analysis.combined, i)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-[13px] leading-normal text-muted-foreground">
          {analysis.form
            ? `Sammanvägd bygger på ${basis}. Spelbar betyder att den sammanvägda sannolikheten är minst 10 % högre än folkets streck.`
            : "Fyll i minst tre matcher per lag för att se vilka tecken som är spelbara."}
        </p>
      </div>
    </div>
  );
}

function percent(values: Triple | null, i: number) {
  return values ? `${formatNumber(values[i], 0)} %` : "–";
}

type FormSeriesProps = {
  title: string;
  results: FormResult[];
  onCycle: (index: number) => void;
};

function FormSeries({ title, results, onCycle }: FormSeriesProps) {
  const t = tally(results);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-3 text-sm">
        <span>{title}</span>
        <span className="text-muted-foreground">{t.played ? `${t.points} p av ${t.played * 3}` : "Ej ifylld"}</span>
      </div>
      <div role="group" aria-label={title} className="flex gap-1.5">
        {results.map((result, i) => (
          <Button
            key={i}
            type="button"
            variant="outline"
            aria-label={`${title}, match ${i + 1}: ${RESULT_WORD[result]}`}
            onClick={() => onCycle(i)}
            className={cn(
              "size-11 rounded-[7px] border-input bg-transparent text-base font-bold text-foreground dark:bg-transparent",
              "hover:border-muted-foreground",
              RESULT_STYLE[result],
            )}
          >
            {result}
          </Button>
        ))}
      </div>
    </div>
  );
}
