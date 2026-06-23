# Shot 1 Notes

Generated on 2026-05-02 for the Ledger Higgsfield builder lane.

## Stage A start-frame comparison

Prompt source: `docs/04_HIGGSFIELD_PROMPTS.md`, Shot 1 start frame prompt, with the negative prompt appended.

Models run:

- Soul 2.0: 4 candidates
- Nano Banana Pro: 4 candidates
- Seedream 4.5: 4 candidates
- GPT Image 2: 4 candidates
- Cinema Studio Image 2.5: 4 candidates

Local review sheet:

- `assets/higgsfield/shot1_starts/contact_sheet_all.jpg`
- `assets/higgsfield/shot1_starts/contact_sheet_order.txt`

Curated one-per-model candidates:

- Soul 2.0: `assets/higgsfield/shot1_starts/candidate_soul_2.png`
- Nano Banana Pro: `assets/higgsfield/shot1_starts/candidate_nano_banana_pro.jpeg`
- Seedream 4.5: `assets/higgsfield/shot1_starts/candidate_seedream_4_5.jpeg`
- GPT Image 2: `assets/higgsfield/shot1_starts/candidate_gpt_image_2.png`
- Cinema Studio Image 2.5: `assets/higgsfield/shot1_starts/candidate_cinema_studio_2_5.jpeg`

Winner: Nano Banana Pro candidate 04.

Why it won:

- Best low-orbit cinematic read without labels or UI-like artifacts.
- Cleanest warm gold San Francisco pulse in the lower-left focal area.
- Strong dark negative space and restrained cyan trail treatment.
- Better production value than Soul 2.0, which became too abstract, and Seedream/GPT variants that introduced map labels or overly literal geography.

Picked frame:

- `assets/higgsfield/shot1_picked.png`
- Source job: `a8038f41-66ad-4b2e-9369-57bfac29e87c`

## Stage B video

Saved render:

- `assets/higgsfield/shot1_video.mp4`
- Source job: `27cdfce4-186f-447c-9511-2644721ba487`
- Model: Cinema Studio Video 3.0
- Duration: 15.041667s
- Resolution: 1280x720
- Frame rate: 24fps
- Audio generation: disabled by MCP

Review sheet:

- `assets/higgsfield/shot1_video_contact.jpg`

Assessment:

- The retake is stronger than the first render: it keeps the low-orbit Earth, cyan trails, and warm gold pulse language while keeping the lower-left San Francisco pulse as the hero focal point through the shot.
- The original render is preserved as `assets/higgsfield/shot1_video_v1_drifted.mp4` for comparison.

Retake:

- Promoted job: `27cdfce4-186f-447c-9511-2644721ba487`
- Prompt tightened the focal instruction around the lower-left San Francisco pulse and explicitly told the model not to pan toward the upper or right-side nodes.

## Gemini checkpoint

The canonical brief asks for a Gemini prompt-helper checkpoint before Stage B. The local `gemini` CLI was not authenticated and opened a first-run auth flow instead of returning a prompt. I attempted the auth launch once, then stopped to avoid stalling the build. The submitted Stage B prompt was manually refined from the canonical brief with the same required camera, lens, motion, pulse timing, and audio constraints.
