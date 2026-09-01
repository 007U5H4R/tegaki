/**
 * Object paths for the private `samples` bucket.
 *
 *     {buyer_uid}/{order_id}/v{version}/{uuid}.{ext}
 *
 * The first segment is not decoration: every storage policy compares it
 * against auth.uid(), and the upload policy proves the second segment names
 * an order the caller owns. Change this shape and the policies in
 * 20260901160000_order_files.sql must change with it — they are one design,
 * written in two places because Postgres and TypeScript cannot share code.
 *
 * The filename is a fresh UUID rather than the customer's own. Original names
 * carry personal information surprisingly often ("rahul-medical-notes.jpg"),
 * and a name is not a good place to leak one.
 */

export function sampleObjectPath(params: {
  buyerId: string
  orderId: string
  version: number
  extension: string
}): string {
  const { buyerId, orderId, version, extension } = params
  return `${buyerId}/${orderId}/v${version}/${crypto.randomUUID()}.${extension}`
}

/** Parse a path back into its parts — used by tests and by the admin viewer. */
export function parseSamplePath(path: string): {
  buyerId: string
  orderId: string
  version: number
} | null {
  const segments = path.split('/')
  if (segments.length !== 4) return null

  const [buyerId, orderId, versionSegment] = segments
  if (!buyerId || !orderId || !versionSegment?.startsWith('v')) return null

  const version = Number(versionSegment.slice(1))
  if (!Number.isInteger(version) || version < 1) return null

  return { buyerId, orderId, version }
}
