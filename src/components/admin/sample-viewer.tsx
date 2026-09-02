import { Card, MicroLabel } from '@/components/ui/card'
import { getSampleUrl } from '@/lib/uploads/signed-url'
import type { AdminOrderFile } from '@/lib/admin/queries'

/**
 * The samples, on a paper-coloured surface.
 *
 * Every image is fetched through a signed URL minted here and valid for ten
 * minutes. There is no other way a sample is ever seen: the bucket is
 * private, so no long-lived link exists to be pasted into a chat, indexed,
 * or left behind in browser history.
 *
 * The URL is minted through the admin's own client, so the storage policy
 * decides — this component never touches the service key.
 *
 * Handwriting is read on cream, not on the dark ground. The washi surface is
 * not decoration: a photograph of a page judged against near-black would
 * mislead about its own contrast.
 */
export async function SampleViewer({ files }: { files: AdminOrderFile[] }) {
  if (files.length === 0) {
    return (
      <Card className="border-err-500/40 bg-err-500/5">
        <p className="text-washi-50 text-sm">
          This order has no samples attached. That should not be possible for a submitted order —
          worth investigating before reviewing it.
        </p>
      </Card>
    )
  }

  const viewable = await Promise.all(
    files.map(async (file) => ({
      file,
      url: await getSampleUrl(file.bucket_path).catch(() => null),
    })),
  )

  const latest = Math.max(...files.map((f) => f.version))

  return (
    <div className="flex flex-col gap-4">
      {viewable.map(({ file, url }) => (
        <figure key={file.id} className="flex flex-col gap-2">
          <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
            <MicroLabel tone={file.version === latest ? 'accent' : 'muted'}>
              v{file.version}
              {file.version === latest && latest > 1 ? ' · latest' : ''} · {file.file_name}
            </MicroLabel>
            <span className="text-ink-500 font-mono text-xs">
              {(file.size_bytes / 1024 / 1024).toFixed(1)} MB
              {url ? (
                <>
                  {' · '}
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-washi-300 hover:text-washi-50 underline"
                  >
                    open full size
                  </a>
                </>
              ) : null}
            </span>
          </figcaption>

          <div className="bg-washi-50 overflow-hidden rounded-2xl p-3">
            {url === null ? (
              <p className="text-ink-950 p-6 text-sm">
                This file could not be opened. It may have been removed from storage.
              </p>
            ) : file.mime === 'application/pdf' ? (
              <object
                data={url}
                type="application/pdf"
                className="h-[70vh] w-full rounded-lg"
                aria-label={`Handwriting sample, version ${file.version}, ${file.file_name}`}
              >
                <p className="text-ink-950 p-6 text-sm">
                  Your browser will not display this PDF inline.{' '}
                  <a href={url} target="_blank" rel="noreferrer" className="underline">
                    Open it in a new tab
                  </a>
                  .
                </p>
              </object>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element -- a signed
                 URL on a private bucket cannot go through the image optimiser,
                 and these are seen once by one person. */
              <img
                src={url}
                alt={`Handwriting sample, version ${file.version}, ${file.file_name}`}
                className="mx-auto max-h-[70vh] w-auto rounded-lg"
              />
            )}
          </div>
        </figure>
      ))}
    </div>
  )
}
