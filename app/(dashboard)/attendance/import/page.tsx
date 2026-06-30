import { importAttendance } from "../actions";
import { Alert } from "@/components/alert";

export default function AttendanceImportPage({
  searchParams
}: {
  searchParams: { error?: string; imported?: string; skipped?: string; errors?: string };
}) {
  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-xl font-semibold text-ink mb-1">Import attendance</h1>
      <p className="text-sm text-ink/50 mb-6">
        CSV or Excel file with columns: <code className="font-mono">employee_code</code>,{" "}
        <code className="font-mono">attendance_date</code>, <code className="font-mono">status</code>{" "}
        (present / absent / half_day / on_leave / holiday / week_off),{" "}
        <code className="font-mono">working_hours</code>, <code className="font-mono">overtime_hours</code>.
      </p>

      <form action={importAttendance} className="bg-white border border-line rounded-xl p-6 space-y-4">
        <input
          type="file"
          name="file"
          accept=".csv,.xlsx,.xls"
          required
          className="block w-full text-sm"
        />

        {searchParams?.error && <Alert>{searchParams.error}</Alert>}

        {searchParams?.imported !== undefined && (
          <div className="text-sm space-y-1">
            <p className="text-accent">{searchParams.imported} rows imported.</p>
            {Number(searchParams.skipped) > 0 && (
              <>
                <p className="text-warn">{searchParams.skipped} rows skipped.</p>
                {searchParams.errors && (
                  <p className="text-ink/50 text-xs">{searchParams.errors}</p>
                )}
              </>
            )}
          </div>
        )}

        <button type="submit" className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2.5 hover:bg-accent/90 transition-colors">
          Upload and import
        </button>
      </form>
    </div>
  );
}
