import Link from "next/link";
import { devLoginHandleFromEnv, getServerUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; handle?: string }>;
}) {
  const user = await getServerUser();
  if (user) redirect(`/u/${user.handle}`);

  const params = await searchParams;
  const dev = devLoginHandleFromEnv();
  const attempt = typeof params.handle === "string" ? params.handle.slice(0, 64) : "";
  const invalid = params.error === "handle";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="text-sm text-muted-foreground">
          {dev
            ? "This server signs you in automatically. Refresh the page if you still see this."
            : "Type a handle to open your grid. There is no password, and the name is the link people use to find you."}
        </p>
      </div>

      {!dev && (
        <form className="flex flex-col gap-4" action="/api/auth/login" method="post">
          <FieldGroup>
            <Field data-invalid={invalid || undefined}>
              <FieldLabel htmlFor="handle">Handle</FieldLabel>
              <Input
                id="handle"
                name="handle"
                defaultValue={attempt}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                aria-invalid={invalid || undefined}
                className="h-11"
              />
              <FieldDescription>
                Letters, numbers, hyphens, and underscores. Anything else is left out.
              </FieldDescription>
              {invalid && <FieldError>Enter a handle to continue.</FieldError>}
            </Field>
          </FieldGroup>
          <Button type="submit" className="h-11 w-full">
            Continue
          </Button>
        </form>
      )}

      <p className="text-sm">
        <Link className="underline underline-offset-4" href="/feed">
          Look at the feed without a handle.
        </Link>
      </p>
    </div>
  );
}
