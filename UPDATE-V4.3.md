# WoSoCenter v4.3 — Strictly lossless image optimization

* Examined **101** PNG files; converted **101** to smaller WebP lossless files.
* Each conversion was compared in **full RGBA pixel data** and original **embedded ICC profile**. Dimensions unchanged.
* Converted only if smaller by at least 2% and 256 bytes. No visual quality change.
* Saved **5,903,492 bytes (28.96% of PNG bytes)**.
* Original JPEG files remained unchanged to avoid any recompression quality loss.
* Image paths updated in the project JSON, JavaScript fallback entries, and CSS masks. All other site features preserved.
* The update ZIP contains new WebP assets and changed text files. Extract and upload all files into the GitHub repository's root, preserving paths.
* Old PNG files on GitHub are no longer referenced; uploading new files cannot delete them. Optional cleanup can be done separately.
* See `IMAGE-OPTIMIZATION-REPORT.json` for detailed per-file verification.
