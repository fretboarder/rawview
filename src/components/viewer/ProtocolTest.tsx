/**
 * ProtocolTest — Dev-only component to verify the rawview:// custom protocol.
 *
 * Fetches a test PNG from the Rust backend via the custom URI protocol
 * and displays it. Also tests 404 handling for unknown IDs.
 *
 * This component is temporary — it will be replaced by ViewerCanvas in Story 2.3.
 */

import { useEffect, useState } from "react"
import { buildTestUrl } from "@/lib/protocolUrl"

export function ProtocolTest() {
  const [testUrl, setTestUrl] = useState<string>("")
  const [fetchStatus, setFetchStatus] = useState<string>("pending")
  const [notFoundStatus, setNotFoundStatus] = useState<string>("pending")
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    const url = buildTestUrl()
    setTestUrl(url)

    // Test 1: Fetch the test PNG and verify 200
    fetch(url)
      .then((res) => {
        if (res.ok) {
          setFetchStatus(`✅ 200 OK (${res.headers.get("content-type")})`)
        } else {
          setFetchStatus(`❌ ${res.status} ${res.statusText}`)
        }
      })
      .catch((err) => {
        setFetchStatus(`❌ Error: ${String(err)}`)
      })

    // Test 2: Fetch an unknown ID and verify 404
    const unknownUrl = url.replace("/viewport/test", "/viewport/unknown-id")
    fetch(unknownUrl)
      .then((res) => {
        if (res.status === 404) {
          setNotFoundStatus("✅ 404 Not Found (correct)")
        } else {
          setNotFoundStatus(`❌ Expected 404, got ${res.status}`)
        }
      })
      .catch((err) => {
        setNotFoundStatus(`❌ Error: ${String(err)}`)
      })
  }, [])

  return (
    <div className="flex flex-col items-center gap-4 p-8 font-mono text-sm">
      <h2 className="text-lg font-semibold">Protocol Test (Dev Only)</h2>

      <div className="flex flex-col gap-2 rounded border border-neutral-700 bg-neutral-900 p-4">
        <div>
          <span className="text-neutral-400">URL: </span>
          <span className="break-all text-neutral-200">{testUrl}</span>
        </div>
        <div>
          <span className="text-neutral-400">Fetch test: </span>
          <span>{fetchStatus}</span>
        </div>
        <div>
          <span className="text-neutral-400">404 test: </span>
          <span>{notFoundStatus}</span>
        </div>
        <div>
          <span className="text-neutral-400">Image load: </span>
          <span>{imageLoaded ? "✅ Loaded" : "⏳ Loading..."}</span>
        </div>
      </div>

      {testUrl && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-neutral-400">Test PNG (2×2 RGBW, scaled up):</p>
          <img
            src={testUrl}
            alt="Protocol test PNG"
            className="border border-neutral-600"
            style={{ width: 128, height: 128, imageRendering: "pixelated" }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />
        </div>
      )}
    </div>
  )
}
