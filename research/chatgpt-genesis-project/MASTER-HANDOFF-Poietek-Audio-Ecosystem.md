# AETHERIUS / POIETEK - MASTER HANDOFF
# DAW + AUDIO ENGINE + INSTRUMENT + EFFECT + PLUGIN ECOSYSTEM
# =====================================================================
#
# Recovered verbatim from the ChatGPT conversation "Continue inheritance
# handoff" in the owner's Genesis project, on 2026-10-20.
#
# The owner asked for this document to be compiled as a handoff for another
# conversation. It is the programme's own direction for the creative
# production ecosystem: eighty-eight numbered sections covering the DAW
# market, workflow families, the audio and MIDI engines, the plugin
# formats and hosts, the effect and synthesis taxonomies, the repository
# rule, the licence law, the research outputs and the final architectural
# principle.
#
# This is the owner's own text. It is a DIRECTIVE, not evidence that
# anything was built. The implementation-status law in section 86 applies
# to every claim in it.
# =====================================================================
Iâ€™ve also built the repository-per-component rule directly into this version. OpenCode should not merely research DAWs: it should turn approved capabilities into a **Poietek/audio repository map**, creating private/local repositories for substantial first-party apps, plugins, instruments, effects and extensions where the boundaries are clear.

A few current licensing points make the audit especially important: LMMS is GPL-2.0; Tracktion Engine is GPL/commercial and depends on separately licensed JUCE; JUCE itself is AGPLv3/commercial; Carla is GPL-2.0-or-later; and CLAP provides an open host/plugin ABI. citeîˆ‚turn284932search5îˆ‚turn284932search0îˆ‚turn284932search2îˆ‚turn289525search0îˆ‚turn289525search6

Paste this into OpenCode:

:::writing{variant="document" id="49731" title="Poietek / Aetherius DAW, Audio Engine, Instruments, Effects and Plugin Ecosystem TODO"}
# POIETEK / AETHERIUS â€” DAW + AUDIO ENGINE + INSTRUMENT + EFFECT + PLUGIN ECOSYSTEM

ADD THIS AS A NEW PERSISTENT PARENT TODO / WORKSTREAM.

WORKSTREAM ID:

`POIETEK-AUDIO-DAW-ENGINE-PLUGIN-ECOSYSTEM`

## OWNER OBJECTIVE

I want to build my own FIRST-PARTY versions of the useful capabilities found across professional and consumer:

- DAWs
- music-production applications
- recording applications
- audio editors
- MIDI sequencers
- beat-making software
- samplers
- grooveboxes
- trackers
- modular/rack environments
- mastering software
- mixing software
- live-performance software
- podcast/audio-production software
- virtual instruments
- synthesizers
- samplers
- drum machines
- audio effects
- MIDI effects
- plugin hosts
- plugin formats
- audio engines
- MIDI engines
- DSP engines
- audio libraries
- control-surface systems
- hardware-integration systems
- sound libraries
- audio analysis systems
- related plugins/extensions

The primary first-party creative-production ecosystem is:

`Poietek`

Aetherius provides shared platform technology where appropriate.

`Universal-Bridge` handles hardware/software/device interoperability.

`Genesis` provides first-party intelligent assistance.

`Agent Bridge` provides bounded tool/software execution.

Do NOT turn Poietek into a renamed copy of FL Studio, Cubase, Pro Tools, Ableton, Reason, Logic, etc.

The process is:

COMPETITOR CAPABILITY
â†’ REQUIREMENT
â†’ OPEN STANDARD
â†’ OPEN-SOURCE TECHNOLOGY / RESEARCH
â†’ FIRST-PARTY ENGINE
â†’ POIETEK APPLICATION / WORKSPACE / PLUGIN
â†’ TEST
â†’ RUNTIME VERIFY
â†’ OWNER TEST

---

# 1. REPOSITORY RULE

Apply the already-approved Aetherius repository policy.

Every substantial independently maintainable first-party:

- app
- engine
- plugin
- extension
- virtual instrument
- effect
- MIDI processor
- sampler
- synthesizer
- service
- SDK
- audio library
- hardware adapter
- device profile family
- format module
- importer/exporter
- analysis tool
- mastering processor
- generator

should normally receive its OWN repository.

Do NOT create one giant Poietek monorepo containing every product.

Also do NOT create one repository per tiny function, preset, EQ curve or source file.

Repository boundary requires a meaningful independent lifecycle.

Default for new first-party repositories:

`VISIBILITY = PRIVATE`

unless Jonathan explicitly approves public release.

Public release remains an OWNER GATE.

---

# 2. RESEARCH THE COMPLETE DAW MARKET

Create:

`DAW_PRODUCT_CAPABILITY_REGISTRY`

Research the CURRENT versions/families of major DAWs and related music-production environments.

Include at minimum:

- FL Studio
- Cubase
- Nuendo
- Pro Tools
- Ableton Live
- Reason
- Logic Pro
- GarageBand
- Studio One
- REAPER
- Bitwig Studio
- Digital Performer
- Waveform
- Cakewalk / Sonar current lineage
- Samplitude
- Sequoia
- Mixcraft
- Renoise
- Harrison Mixbus
- Ardour
- LMMS
- Zrythm
- BandLab
- MPC Software
- Maschine software
- Akai MPC standalone workflow
- FL Studio Mobile
- Cubasis
- Logic iPad
- GarageBand iOS/iPadOS
- n-Track
- Audio Evolution Mobile
- Koala Sampler where relevant
- Drambo where relevant
- AUM where relevant
- Loopy Pro where relevant
- other significant desktop/mobile/web DAWs

Do not stop at this seed list.

Discover other important current products.

For each product record:

VENDOR
PRODUCT
VERSION
PRODUCT_FAMILY
PLATFORM
DESKTOP
WEB
MOBILE
PRICE_MODEL
TARGET_USER
RECORDING
MIDI
ARRANGEMENT
CLIP_LAUNCHING
STEP_SEQUENCING
TRACKER
PIANO_ROLL
NOTATION
SAMPLING
SYNTHESIS
DRUMS
AUDIO_EDITING
MIXING
MASTERING
AUTOMATION
MODULATION
ROUTING
PLUGIN_FORMATS
HARDWARE_SUPPORT
CONTROL_SURFACES
SYNC
COLLABORATION
CLOUD
AI
FILE_FORMATS
PROJECT_FORMAT
IMPORT
EXPORT
EXTENSION_MODEL
SCRIPTING
API
SDK
DISTINGUISHING_FEATURES
POIETEK_EQUIVALENT
SOURCE
LAST_CHECKED

---

# 3. STUDY WORKFLOW FAMILIES â€” NOT JUST PRODUCTS

Separate the major DAW philosophies.

## LINEAR DAW

Cubase
Pro Tools
Logic
Studio One
REAPER
etc.

Study:

timeline
tracks
clips
regions
takes
comping
automation
mixing
routing

## PATTERN / BEAT WORKFLOW

FL Studio
LMMS
MPC
Maschine
etc.

Study:

patterns
step sequencer
piano roll
channel rack
scenes
clips
pads
patterns-to-arrangement

## SESSION / CLIP WORKFLOW

Ableton Live
Bitwig
etc.

Study:

clip launcher
scenes
session view
performance
nonlinear composition
live arrangement capture

## MODULAR / RACK WORKFLOW

Reason
Bitwig
VCV-inspired environments
etc.

Study:

devices
front/rear routing
cables
modulation
rack containers
macro control
signal graphs

## TRACKER WORKFLOW

Renoise
SunVox
OpenMPT and others.

Study:

tracker notation
patterns
sample manipulation
commands
high-speed keyboard workflow

## HARDWARE-CENTRIC WORKFLOW

MPC
Maschine
grooveboxes
samplers
controllers

Study:

pads
encoders
touchscreens
hardware/software state
standalone/desktop interchange
session transfer
sample transfer

Poietek should be capable of combining useful workflow models without becoming confusing.

---

# 4. POIETEK CORE PRODUCT MODEL

Existing approved principle remains:

ONE APP.
ONE PROJECT MODEL.
ONE CREATIVE GRAPH.
MANY WORKSPACES.

Research how Poietek can provide workspaces such as:

- Create
- Record
- Arrange
- Beats
- Clip Launcher
- Piano Roll
- Tracker
- Sampler
- Drum Machine
- Synth
- Rack
- Mixer
- Routing
- Audio Editor
- MIDI Editor
- Score/Notation
- Sound Design
- Podcast
- Mastering
- Live
- Hardware
- Automation
- Modulation
- Asset Browser
- Stem Workspace
- Performance
- Broadcast
- Collaboration

Do not require separate incompatible project formats for each workspace.

---

# 5. DAW CORE ENGINE RESEARCH

Research technology required for:

`Poietek Audio Engine`

At minimum:

- real-time audio graph
- lock-free real-time processing
- audio callback architecture
- multithreading
- multicore scheduling
- DSP graph
- plugin graph
- routing graph
- latency compensation
- plugin delay compensation
- buffer management
- sample-rate conversion
- resampling
- oversampling
- offline rendering
- freeze
- bounce
- render-in-place
- track rendering
- stem rendering
- caching
- proxy audio
- disk streaming
- recording
- punch in/out
- loop recording
- pre-roll
- post-roll
- take management
- comping
- crossfades
- fades
- gain envelopes
- waveform cache
- undo/redo
- crash recovery
- autosave
- project persistence

---

# 6. AUDIO ENGINE SEED REPOSITORIES

Investigate canonical upstreams, current activity and licensing for:

- Ardour/ardour
- LMMS/lmms
- zrythm/zrythm
- Tracktion/tracktion_engine
- juce-framework/JUCE
- falkTX/Carla
- DISTRHO/DPF
- iPlug2/iPlug2
- chowdsp/chowdsp_utils
- miniaudio/miniaudio
- PortAudio/portaudio
- thestk/rtaudio
- thestk/rtmidi
- libremidi/libremidi
- libsndfile/libsndfile
- libsamplerate/libsamplerate
- chirlu/soxr or canonical upstream
- signalsmith-audio/signalsmith-stretch
- breakfastquay/rubberband
- aubio/aubio
- MTG/essentia
- xiph/speexdsp where relevant
- FFTW
- PFFFT
- KissFFT
- Eigen
- xsimd

These are research seeds.

DO NOT automatically fork or integrate them.

---

# 7. TRACKTION ENGINE / JUCE LICENSING WARNING

Specifically investigate Tracktion Engine and JUCE licensing before architecture selection.

Current public material indicates Tracktion Engine uses GPL/commercial licensing and relies on JUCE.

Current JUCE uses AGPLv3/commercial licensing.

Therefore:

DO NOT assume either can become the proprietary first-party Poietek foundation without licensing implications.

Classify possible usage:

DEPENDENCY
COMMERCIAL_LICENSE_CANDIDATE
GPL_BUILD_REFERENCE
ARCHITECTURAL_REFERENCE
CLEAN_ROOM_REFERENCE
REJECTED_LICENSE

Compare alternatives.

---

# 8. AUDIO I/O

Research:

Windows:
- WASAPI
- ASIO
- Windows audio APIs

Linux:
- PipeWire
- JACK
- ALSA
- PulseAudio compatibility

Apple:
- Core Audio

Mobile:
- Android AAudio/Oboe
- iOS Core Audio concepts

Web:
- Web Audio API
- AudioWorklet

Create:

`AUDIO_BACKEND_REGISTRY`

Fields:

BACKEND
PLATFORM
LATENCY
EXCLUSIVE_MODE
MULTICHANNEL
MIDI
HOTPLUG
CLOCKING
DEVICE_ENUMERATION
LICENCE
IMPLEMENTATION
POIETEK_SUPPORT

---

# 9. MIDI DEEP DIVE

Carry forward the existing Universal-Bridge MIDI requirements.

Research:

MIDI 1.0
MIDI 2.0
UMP

including:

- Note On/Off
- velocity
- release velocity
- poly pressure
- channel pressure
- CC
- RPN
- NRPN
- program change
- pitch bend
- SysEx
- MIDI Clock
- MTC
- MMC
- MPE
- MIDI CI
- profiles
- property exchange where relevant
- timestamps
- jitter
- latency
- virtual MIDI
- network MIDI
- USB MIDI
- BLE MIDI

Investigate:

- libremidi
- RtMidi
- ALSA MIDI
- JACK MIDI
- PipeWire MIDI
- Microsoft MIDI Services
- CoreMIDI
- Android MIDI
- Web MIDI where relevant

Do NOT duplicate Universal-Bridge.

Universal-Bridge owns broad hardware/software interoperability.

Poietek consumes the interfaces.

---

# 10. PLUGIN FORMAT REGISTRY

Create:

`AUDIO_PLUGIN_STANDARD_REGISTRY`

Research current specifications and legal conditions for:

- CLAP
- VST3
- Audio Units
- AUv3
- LV2
- LADSPA
- DSSI
- AAX
- VST2 legacy
- CLAP extensions
- standalone plugins
- internal Poietek native plugins

For each:

OWNER
OPEN_SPEC
SOURCE_AVAILABLE
SDK
SDK_LICENSE
HOST_LICENSE_REQUIREMENTS
PLUGIN_LICENSE_REQUIREMENTS
WINDOWS
LINUX
MACOS
IOS
ANDROID
MIDI
AUDIO
INSTRUMENT
EFFECT
NOTE_EXPRESSIONS
PARAMETERS
AUTOMATION
THREADING
GUI
SANDBOXING
PRESETS
STATE
EXTENSIONS
AETHERIUS_SUPPORT
RISK

CLAP should receive serious evaluation as an open modern host/plugin interface.

Research its extension architecture and stable ABI.

---

# 11. VST3

Investigate the CURRENT official:

`steinbergmedia/vst3sdk`

Do not rely on historical VST licensing assumptions.

Verify current:

- SDK licence
- trademark conditions
- plugin-host rights
- redistribution
- validator
- wrappers
- platform support
- examples
- headers
- compatibility obligations

Record separately from VST2.

VST2 is legacy and has different historical licensing constraints.

Do not mix them.

---

# 12. AAX / PRO TOOLS INTEROPERABILITY

Research legitimate public AAX development requirements.

Treat AAX primarily as interoperability.

Do not reproduce proprietary Avid technology.

Record:

SDK_ACCESS
SIGNING
DEVELOPER_REQUIREMENTS
SUPPORTED_PLATFORMS
PLUGIN_WRAPPER_OPTIONS
LEGAL_RESTRICTIONS

If unavailable without developer agreements:

`OWNER_GATE / EXTERNAL_AGREEMENT_REQUIRED`

---

# 13. PLUGIN HOST

Research a first-party:

`Poietek Plugin Host`

Capabilities:

- scan plugins
- identify format
- validate
- quarantine bad plugin
- crash isolation
- plugin sandbox
- plugin bridging
- 32/64-bit considerations
- architecture bridging
- host process separation
- per-plugin process
- blacklist
- rescan
- metadata
- categories
- manufacturer
- versions
- presets
- latency
- I/O
- sidechain
- MIDI
- automation
- state saving
- plugin GUI
- generic GUI
- parameter mapping

Study Carla carefully as a plugin-host reference.

Do not simply embed Carla without licence review.

---

# 14. FIRST-PARTY PLUGIN API

Design a native future:

`Poietek Plugin API`

or shared:

`Aetherius Audio Plugin API`

Requirements:

- versioned ABI/API
- audio effects
- MIDI effects
- instruments
- analysers
- generators
- modulators
- utilities
- offline processors
- UI extensions
- automation
- modulation
- presets
- state
- sidechains
- multi-bus
- surround/spatial
- real-time safety
- sandboxing
- permissions
- metadata

Potentially bridge native plugins to:

CLAP
VST3
LV2
AU/AUv3

where lawful and technically appropriate.

Do not make proprietary formats the canonical internal API.

---

# 15. PLUGIN REPOSITORY POLICY

EVERY substantial first-party Poietek plugin should normally receive its own repo.

Examples:

`poietek-eq`

`poietek-compressor`

`poietek-limiter`

`poietek-reverb`

`poietek-delay`

`poietek-saturator`

`poietek-sampler`

`poietek-synth`

etc.

However:

DO NOT create a separate repository for every factory preset.

A plugin repository should represent actual source implementation and an independent lifecycle.

Create:

`POIETEK_PLUGIN_REPOSITORY_REGISTRY`

---

# 16. EFFECT TAXONOMY

Research EVERY major audio-effect family.

At minimum:

## DYNAMICS

- compressor
- limiter
- clipper
- expander
- gate
- transient designer
- multiband compressor
- upward compression
- downward compression
- de-esser
- maximiser

## EQ / FILTERING

- parametric EQ
- graphic EQ
- dynamic EQ
- linear-phase EQ
- minimum-phase EQ
- shelving
- high-pass
- low-pass
- band-pass
- notch
- comb
- state-variable
- crossover
- filter bank
- resonant filter

## TIME

- delay
- tape delay
- digital delay
- ping-pong
- multitap
- echo
- reverb
- convolution reverb
- algorithmic reverb
- spring
- plate
- room
- hall
- chamber

## MODULATION

- chorus
- flanger
- phaser
- tremolo
- vibrato
- rotary
- autopan
- ring modulation
- frequency shifting

## DISTORTION

- saturation
- distortion
- overdrive
- fuzz
- clipping
- waveshaping
- bit crushing
- sample-rate reduction
- tape
- tube
- console emulation

## PITCH / TIME

- pitch shift
- harmoniser
- time stretch
- formant shift
- vocal tuning
- pitch correction
- quantised tuning
- vocoder

## STEREO / SPATIAL

- stereo width
- mid/side
- panning
- binaural
- HRTF
- surround
- Ambisonics
- spatial audio
- object positioning
- room simulation

## RESTORATION

- denoise
- dehum
- declick
- decrackle
- declip
- dereverb
- dialogue isolation
- spectral repair
- noise profiling

## ANALYSIS

- spectrum
- spectrogram
- oscilloscope
- vectorscope
- phase
- correlation
- loudness
- peak
- RMS
- LUFS
- true peak
- tuner
- pitch tracker

## GUITAR / INSTRUMENT FX

- amplifier
- cabinet
- convolution cabinet
- pedal
- wah
- overdrive
- distortion
- compressor
- tuner

Research repositories for each family.

---

# 17. OPEN-SOURCE EFFECT REPOSITORIES

Investigate:

- lsp-plugins/lsp-plugins
- Calf Studio Gear
- x42 plugins
- zam-plugins
- DISTRHO-Ports
- ChowDSP plugins
- Guitarix
- Dragonfly Reverb
- Airwindows
- TAP plugins
- SWH plugins
- MDA plugin ports
- GuitarML
- Neural Amp Modeler public/open components
- MOD Audio plugin ecosystem
- other mature open plugin collections

Verify exact licences individually.

Do not assume every plugin in a collection uses identical licensing.

---

# 18. SYNTHESIS TAXONOMY

Research:

- subtractive
- additive
- FM
- phase modulation
- wavetable
- sample-based
- granular
- physical modelling
- modal
- spectral
- vector
- wave sequencing
- phase distortion
- West Coast
- modular
- semi-modular
- hybrid
- neural/generated synthesis
- drum synthesis

Build:

`SYNTHESIS_ENGINE_REGISTRY`

---

# 19. OPEN SYNTH / INSTRUMENT REPOSITORIES

Investigate at minimum:

- surge-synthesizer/surge
- Dexed
- Odin 2
- Helm
- Vitalium
- OB-Xf
- OB-Xd
- Yoshimi
- ZynAddSubFX
- amsynth
- Helm
- Cardinal
- VCV-related OPEN components where licensing permits
- DrumGizmo
- Hydrogen
- Sfizz
- FluidSynth
- LinuxSampler where licence allows
- SFZero-related implementations
- Munt where relevant
- ChowDSP instruments
- DISTRHO instruments

Surge XT is particularly useful as a research reference for modern synthesis/plugin architecture, but its GPL licensing must be respected.

Do not copy GPL source into incompatible first-party products.

---

# 20. FIRST-PARTY SYNTH REPOSITORIES

Determine architectural boundaries for future first-party Poietek instruments.

Possible repositories:

`poietek-synth-core`

`poietek-subtractive`

`poietek-fm`

`poietek-wavetable`

`poietek-granular`

`poietek-additive`

`poietek-physical-model`

`poietek-sampler`

`poietek-drum-machine`

`poietek-modular`

Do NOT automatically create all until shared-engine boundaries are analysed.

Substantial independent instruments should ultimately have their own repos.

---

# 21. SAMPLER ENGINE

Research:

- sample loading
- streaming
- RAM/disk balance
- multisamples
- round robin
- velocity layers
- key zones
- root note
- pitch tracking
- looping
- crossfade loops
- envelopes
- modulation
- filters
- LFO
- slicing
- transient detection
- chopping
- timestretch
- pitch shift
- warping
- multisample mapping
- choke groups
- one-shot
- granular
- sample start modulation
- resampling
- destructive/non-destructive editing

Formats to research:

- WAV
- AIFF
- FLAC
- SF2
- SF3
- SFZ
- DLS
- DecentSampler format if open/public
- EXS compatibility where legally documented
- Akai formats where legitimate documentation/reverse engineering permits
- MPC formats where legitimate
- other open sampler formats

---

# 22. SFZ / SOUNDFONT

Investigate:

- sfizz
- FluidSynth
- libinstpatch
- SF2/SF3 specifications
- SFZ ecosystem

Evaluate whether Poietek should have first-class open sampler-format support.

---

# 23. DRUM MACHINE / BEAT SYSTEM

Research:

- pattern sequencer
- step sequencer
- probability
- ratchets
- swing
- groove
- per-step automation
- parameter locks
- polymeter
- polyrhythm
- microtiming
- velocity
- aftertouch
- sample layers
- choke groups
- pad banks
- pattern chains
- scenes
- song mode

Study workflows from:

MPC
Maschine
FL Studio
Ableton
Reason
Elektron
Hydrogen
LMMS
other groovebox systems

Do not copy proprietary UI.

---

# 24. PIANO ROLL

Research best workflow concepts from:

FL Studio
Cubase
Ableton
Logic
Studio One
Bitwig
REAPER
LMMS
Zrythm
MPC

Features:

- notes
- velocities
- expression
- CC lanes
- MPE
- MIDI 2.0
- probability
- ratchets
- scales
- chords
- ghost notes
- strum
- arpeggiation
- humanisation
- quantisation
- groove
- legato
- note splitting
- note joining
- articulation
- per-note modulation

---

# 25. SCORE / NOTATION

Research:

- MuseScore
- LilyPond
- Verovio
- MusicXML
- MEI
- ABC notation
- MIDI-to-score
- score-to-MIDI

Potential repository:

`poietek-score`

or shared Aetherius notation engine if useful beyond music production.

---

# 26. AUDIO EDITING

Research:

- Audacity
- Ardour
- Tenacity
- Ocenaudio functionality as proprietary/reference if applicable
- Snd
- SoX
- FFmpeg audio processing
- libsndfile

Capabilities:

- cut
- copy
- paste
- trim
- split
- crop
- normalize
- reverse
- fade
- gain
- silence
- resample
- convert
- spectral editing
- destructive editing
- nondestructive editing
- batch processing

---

# 27. TIME STRETCH / PITCH SHIFT

Investigate:

- Signalsmith Stretch
- Rubber Band Library
- SoundTouch
- aubio-related analysis
- phase vocoder implementations
- WSOLA
- PSOLA
- granular techniques

Record:

QUALITY
REAL_TIME
OFFLINE
CPU_COST
TRANSIENT_HANDLING
FORMANT
POLYPHONIC
MONOPHONIC
LICENCE

Track licensing carefully.

---

# 28. AUDIO ANALYSIS

Research:

- Essentia
- aubio
- librosa
- Vamp Plugins/API
- Sonic Visualiser
- BBC Audio Waveform
- Chromaprint/AcoustID
- FFT libraries
- beat trackers
- onset detection
- pitch detection
- chord detection
- key detection

Poietek analysis capabilities may include:

BPM
tempo map
key
chords
pitch
onsets
transients
beats
bars
loudness
true peak
silence
spectrogram
fingerprint
similarity
instrument classification

---

# 29. STEM SEPARATION / SOURCE SEPARATION

Research legitimate open implementations:

- Demucs
- Open-Unmix
- Spleeter
- MDX-related open projects
- other current open separation systems

Record model licences separately from source-code licences.

Capabilities:

- vocals
- drums
- bass
- other
- instrument stems
- dialogue/music/effects where models permit

Do not label AI separation as perfect reconstruction.

---

# 30. VOICE / VOCAL PROCESSING

Research:

- pitch correction
- vocal tuning
- formants
- de-essing
- denoise
- dereverb
- voice isolation
- harmonisation
- vocoder
- speech enhancement
- transcription

Study Melodyne/Auto-Tune-style capabilities as FUNCTIONAL REFERENCES only.

Do not clone proprietary algorithms.

Search scientific/public alternatives.

---

# 31. MIXER

Poietek Mixer should eventually research:

- unlimited/configurable channels
- audio tracks
- MIDI/instrument tracks
- buses
- groups
- VCAs
- auxes
- returns
- sends
- inserts
- pre/post fader
- sidechains
- direct outs
- hardware inserts
- mono
- stereo
- multichannel
- surround
- spatial
- folders
- colour/grouping
- gain
- pan
- mute
- solo
- automation
- metering
- routing matrix
- patch cables
- snapshots
- scenes

Preserve approved Poietek mixing-console design references.

---

# 32. ROUTING

Build/research:

`Poietek Routing Graph`

Need:

TRACK
â†’ PLUGIN
â†’ BUS
â†’ SEND
â†’ RETURN
â†’ HARDWARE
â†’ OUTPUT

plus arbitrary routing where safe.

Study:

Reason rack
Bitwig
REAPER routing
Ardour
Carla Patchbay
JACK graph
PipeWire graph

Visual routing is important.

---

# 33. MODULATION

Research:

- LFO
- envelope
- envelope follower
- step modulator
- random
- sample-and-hold
- macro
- MIDI mapping
- audio-rate modulation where safe
- per-note expression

Allow reusable modulation between compatible parameters.

---

# 34. AUTOMATION

Research:

- write
- read
- touch
- latch
- trim
- curves
- points
- bezier
- stepped
- smoothing
- relative automation
- clip automation
- track automation
- plugin automation
- MIDI automation
- hardware automation

---

# 35. REASON / MODULAR RACK RESEARCH

Carry forward existing requirement.

Study Reason for:

- device rack
- modular device construction
- front/rear concepts
- signal routing
- CV-style modulation concepts
- combinators
- macro controls
- instruments
- effects
- players/MIDI effects

Reason is an architectural/workflow reference.

Do not clone Reason source, branding, device designs or proprietary ReWire.

Build first-party interoperability through Universal-Bridge and open plugin/IPC standards.

---

# 36. ABLETON-LIKE PERFORMANCE CONCEPTS

Research:

- clips
- scenes
- session launching
- follow actions
- warping
- live performance
- automation
- capture
- arrangement recording
- controllers
- Ableton Link

Investigate official/open Ableton Link technology and licensing.

Potential Universal-Bridge integration.

---

# 37. FL STUDIO-LIKE WORKFLOW CONCEPTS

Research functional concepts:

- channel rack
- step sequencer
- strong piano roll
- patterns
- playlist
- mixer routing
- automation clips
- plugin wrapper
- browser
- Patcher-style modular routing

Do not copy FL Studio branding/UI.

---

# 38. CUBASE / NUENDO CONCEPTS

Research:

- MIDI depth
- score
- articulation
- audio warp
- comping
- mixer
- control room
- video/post-production
- surround
- expression maps
- media management

Build first-party equivalents where useful.

---

# 39. PRO TOOLS CONCEPTS

Research:

- recording
- editing
- playlists
- comping
- groups
- routing
- buses
- automation
- post-production
- sync
- video
- control surfaces
- professional session management

Treat AAX as an interoperability target.

---

# 40. LOGIC / GARAGEBAND CONCEPTS

Research:

- accessible project creation
- loops
- drummer
- virtual instruments
- score
- live loops
- recording
- smart controls
- mobile/desktop workflow

Poietek should support both beginner-accessible and professional-depth workflows.

---

# 41. BITWIG CONCEPTS

Research:

- modulation
- hybrid clip/timeline
- device chains
- containers
- sandboxing
- Grid/modular synthesis
- expression
- MPE
- plugin isolation

---

# 42. REAPER CONCEPTS

Research:

- lightweight architecture
- routing
- custom actions
- scripting
- extensions
- themes
- parameter modulation
- flexible tracks
- automation
- portable installation concepts

Do not copy proprietary source.

---

# 43. HARDWARE INTEGRATION

Universal-Bridge owns device abstraction.

Poietek should consume:

DEVICE_ID
CAPABILITIES
PADS
KEYS
KNOBS
FADERS
ENCODERS
DISPLAYS
TRANSPORT
AUDIO_IO
MIDI_IO
CLOCK
SAMPLE_TRANSFER
PROJECT_TRANSFER

Device families to study:

- Akai MPC
- Akai MPK
- Ableton Push
- Maschine
- Novation Launchpad
- Novation Circuit
- Arturia
- Native Instruments keyboards/controllers
- MIDI keyboards
- control surfaces
- Mackie Control
- HUI where legally documented
- Roland SP
- Elektron
- DJ controllers
- mixers
- audio interfaces
- e-drums

Do not hard-code Poietek to one manufacturer.

---

# 44. SYNCHRONISATION

Research:

- MIDI Clock
- MTC
- MMC
- Ableton Link
- JACK Transport
- LTC
- word clock concepts
- sample clock
- network sync
- tempo maps
- external clock

Create:

`POIETEK_SYNC_ENGINE`

where appropriate.

---

# 45. AUDIO FILE FORMATS

Build:

`AUDIO_FORMAT_REGISTRY`

Research:

- WAV
- RF64
- BWF
- AIFF
- FLAC
- ALAC
- Ogg
- Opus
- MP3
- AAC
- M4A
- WavPack
- CAF
- DSD-related formats where relevant
- MIDI
- SMF
- SF2
- SF3
- SFZ

Record:

SPEC
LICENCE/PATENT STATUS
READ
WRITE
METADATA
LOOP_POINTS
MULTICHANNEL
LOSSLESS
LOSSY
STREAMING
AETHERIUS_SUPPORT

---

# 46. PROJECT / SESSION INTERCHANGE

Continue existing Universal-Bridge research.

Deep dive:

- DAWproject
- OpenTimelineIO where appropriate
- AAF
- OMF
- ADM/BWF
- MIDI
- stems
- consolidated audio
- project converters
- ConvertWithMoss
- dawproject implementations
- ProjectConverter

Build first-party canonical Poietek project schema.

External project formats become adapters.

---

# 47. PODCAST WORKSPACE

Connect existing Podcasting 2.0 work.

Poietek Podcast Workspace may use:

- multitrack recording
- editing
- cleanup
- loudness
- chapters
- transcripts
- contributors
- artwork
- RSS
- Podcasting 2.0
- clips
- video
- live
- distribution
- analytics
- archive
- rights

Reuse shared audio engine.

Do not create an unrelated second audio stack.

---

# 48. MASTERING

Research:

- loudness
- LUFS
- true peak
- EQ
- dynamics
- stereo
- multiband
- limiting
- clipping
- dithering
- sample-rate conversion
- metering
- reference tracks
- album sequencing
- metadata
- delivery formats

Study commercial mastering products functionally, plus open DSP implementations.

---

# 49. SPATIAL / SURROUND AUDIO

Research:

- mono
- stereo
- 2.1
- 5.1
- 7.1
- 7.1.4
- Ambisonics
- binaural
- HRTF
- object-based audio concepts

Investigate:

- IEM Plug-in Suite
- SPARTA
- libmysofa
- Ambisonics libraries
- OpenAL Soft spatial components
- Resonance Audio open components where still appropriate

Proprietary Dolby/DTS technology requires appropriate licences.

Do not clone it.

---

# 50. MUSIC INFORMATION / RIGHTS

Reuse the existing:

RIGHTS_MANIFEST
IDENTIFIER_REGISTRY

Support concepts including:

ISRC
ISWC
PRS Tune Code
IPI/CAE
UPC/EAN
GRid where applicable
DDEX
writers
publishers
performers
producers
engineers
credits
splits
ownership
licensing

Credit != Rights != Payment.

---

# 51. AUDIO ASSET DATABASE

Create/research:

`Poietek Asset Library`

Need:

- samples
- loops
- one-shots
- presets
- instruments
- MIDI
- stems
- recordings
- projects
- impulse responses
- wavetables
- patches

Metadata:

BPM
KEY
SCALE
TYPE
INSTRUMENT
GENRE
MOOD
DURATION
SAMPLE_RATE
BIT_DEPTH
CHANNELS
LOUDNESS
SOURCE
DEVICE
LICENCE
RIGHTS
HASH
FINGERPRINT
TAGS
PROVENANCE

Reuse existing Audio Dump pipeline.

---

# 52. AUDIO DUMP

Existing principle remains:

IMPORT/CAPTURE
â†’ HASH
â†’ DUPLICATE CHECK
â†’ BASIC METADATA
â†’ AUDIO ANALYSIS
â†’ WAVEFORM
â†’ SOURCE/DEVICE PROVENANCE
â†’ TAG/SEARCH
â†’ ROUTE TO DESTINATION

Never overwrite originals.

---

# 53. OPEN AUDIO DATASETS

Find legally reusable datasets for:

- speech
- singing
- isolated instruments
- drums
- piano
- guitar
- orchestral
- multitrack music
- mixing
- source separation
- room impulse responses
- HRTFs
- noise
- reverberation
- pitch
- chords
- beat tracking
- onset detection
- transcription
- MIDI
- aligned MIDI/audio
- synthesis
- acoustic measurements

Potential sources to investigate:

- MedleyDB
- MUSDB18
- Slakh
- MAESTRO
- NSynth
- FSD50K
- AudioSet conditions/licence
- Freesound datasets/terms
- OpenAIR impulse responses
- SOFA/HRTF datasets
- OpenMIC
- MusicNet
- GiantMIDI-related datasets where terms permit
- Groove MIDI Dataset
- RWC datasets â€” CHECK licensing
- public university MIR datasets

For each:

DATASET
OWNER
LICENCE
COMMERCIAL_USE
REDISTRIBUTION
MODIFICATION
ATTRIBUTION
SIZE
FORMAT
DOMAIN
QUALITY
USE_CASE
PROVENANCE

Dataset availability does NOT automatically mean commercial reuse permission.

---

# 54. AUDIO BENCHMARKS

Find benchmarks for:

- latency
- dropout
- CPU
- plugin scaling
- sample-rate conversion
- time stretching
- pitch shift
- resampling
- codec quality
- loudness
- source separation
- transcription
- onset detection
- BPM
- key
- pitch
- DSP numerical correctness

Create:

`AUDIO_BENCHMARK_REGISTRY`

---

# 55. DSP TESTING

For each DSP plugin test:

- impulse response
- frequency response
- phase response
- THD
- THD+N where appropriate
- aliasing
- noise floor
- latency
- denormals
- stability
- NaN/Inf
- sample rates
- block sizes
- channel configurations
- automation
- extreme parameters

Visual appearance does not prove DSP correctness.

---

# 56. PLUGIN TEST HOST

Research/build a first-party plugin validation environment.

Potential:

`poietek-plugin-lab`

Capabilities:

- instantiate plugin
- scan
- enumerate parameters
- test state
- test preset
- test audio
- test MIDI
- automate
- stress
- vary block size
- vary sample rate
- test silence
- test multichannel
- test sidechain
- detect crash
- detect hang
- benchmark CPU
- measure latency
- compare output
- generate report

Give it its own repo if implemented independently.

---

# 57. EFFECT / PLUGIN DEVELOPMENT SDK

Potential:

`poietek-plugin-sdk`

or shared:

`aetherius-audio-sdk`

Provide safe common components:

- plugin base
- parameters
- automation
- MIDI
- GUI
- presets
- state
- meters
- DSP utilities
- FFT
- oversampling
- filters
- envelopes
- modulators
- testing
- packaging
- manifests

Investigate DPF and iPlug2 for architecture/reference.

Compare with JUCE without assuming JUCE is the final framework.

---

# 58. PLUGIN MANIFEST

Use the existing repository policy and define:

`poietek-plugin.json`

Potential fields:

plugin_id
name
vendor
version
type
category
formats
entrypoint
audio_inputs
audio_outputs
midi_input
midi_output
parameters
latency
sidechain
supported_sample_rates
supported_channels
permissions
filesystem
network
device_access
genesis_access
universal_bridge_access
sandbox
state_schema
preset_schema
licence
repository
signature

---

# 59. PLUGIN SANDBOX / SECURITY

Plugins should not automatically receive full host privileges.

Research:

- process isolation
- crash isolation
- filesystem permissions
- network permissions
- IPC
- plugin signing
- trust
- quarantine
- validation
- watchdogs

A faulty third-party plugin should ideally not destroy the entire project session.

---

# 60. FIRST-PARTY EFFECT REPOSITORY PLAN

Generate:

`POIETEK_EFFECT_REPOSITORY_PLAN`

Group:

ESSENTIAL

- EQ
- compressor
- limiter
- gate
- reverb
- delay
- chorus
- saturation
- filter
- tuner
- spectrum analyser

PRODUCTION

- multiband
- dynamic EQ
- transient processor
- de-esser
- convolution
- stereo tools
- pitch
- time

CREATIVE

- granular
- glitch
- spectral
- modulation
- resonators
- vocoder
- experimental DSP

RESTORATION

- denoise
- declip
- declick
- dereverb

MASTERING

- metering
- loudness
- multiband
- limiter
- dither

Do not implement every plugin simultaneously.

---

# 61. GENESIS AUDIO INTEGRATION

Genesis may provide:

- recording assistance
- session setup
- arrangement suggestions
- chord assistance
- MIDI generation
- sound-search
- sample-search
- instrument selection
- mix analysis
- gain staging
- routing assistance
- effect suggestions
- automation suggestions
- mastering assistance
- transcription
- stem analysis
- metadata
- project organisation
- hardware troubleshooting

Genesis output must remain distinguishable from deterministic DSP results.

AI suggestion != measured audio fact.

---

# 62. AGENT BRIDGE

Agent Bridge may execute bounded actions such as:

- create track
- import files
- instantiate plugin
- route signal
- render stems
- analyse audio
- scan devices
- run conversion
- inspect logs
- export session

Dangerous/destructive operations require suitable permissions.

---

# 63. UNIVERSAL-BRIDGE

Universal-Bridge is critical.

DO NOT merge Universal-Bridge and Poietek into one repository.

Universal-Bridge supplies reusable interoperability for:

DAW
â†” hardware

DAW
â†” device

DAW
â†” other DAW

DAW
â†” plugin

DAW
â†” mobile

DAW
â†” external software

DAW
â†” legacy sampler/groovebox

Potential functionality:

- device detection
- auto mapping
- MIDI translation
- CC/NRPN
- SysEx
- transport
- sync
- audio routing
- stem transfer
- sample transfer
- project transfer
- latency
- profiles
- hot-swap
- diagnostics

---

# 64. HARDWARE ISSUE CORPUS

Link this work to existing:

DEVICE_ISSUE_CORPUS

especially:

MPC
SP-404
Maschine
Elektron
Novation
audio interfaces
controllers
MIDI
legacy hardware

Map problems Poietek/Universal-Bridge can legitimately solve.

---

# 65. CROSS-PLATFORM

Target architecture should consider:

Windows
Linux
macOS
iOS/iPadOS
Android

and where appropriate:

Web

Desktop Poietek may be the deepest implementation.

Mobile may expose purpose-built workspaces rather than forcing the entire desktop UI onto a phone.

---

# 66. REAL-TIME PERFORMANCE LAW

Audio threads require special treatment.

DO NOT perform on a real-time audio callback where avoidable:

- heap allocation
- filesystem I/O
- network I/O
- blocking locks
- unpredictable AI inference
- slow logging
- heavy GUI operations

Research proper real-time architecture.

Genesis work should normally execute outside the audio callback.

---

# 67. RESOURCE-CONSTRAINED DEVELOPMENT MACHINE

Current Windows development machine is old/resource constrained.

Do NOT clone/build every DAW and plugin collection simultaneously.

Pipeline:

DISCOVER
â†’ METADATA
â†’ LICENCE
â†’ SIZE
â†’ DUPLICATE
â†’ VALUE
â†’ SHORTLIST
â†’ SELECTIVE FETCH
â†’ SELECTIVE BUILD

Use bounded concurrency.

---

# 68. REPOSITORY INVENTORY BEFORE FORKING

Before recommending ANY fork:

Inspect the COMPLETE:

`jayprophit`

repository inventory using authoritative pagination.

Known previous forks may already include audio technologies.

Do not recommend duplicates.

Empty repositories may be owner learning repos.

Never delete them simply because they are empty.

---

# 69. EXTERNAL REPO CLASSIFICATION

Classify every external project:

FORK_HIGH

FORK_MEDIUM

FORK_LOW

DEPENDENCY

PLUGIN

SDK

API_SERVICE

SUBMODULE

REFERENCE_IMPLEMENTATION

ARCHITECTURAL_REFERENCE

ALGORITHM_REFERENCE

SPECIFICATION_SOURCE

TEST_BENCH

DATASET

CLEAN_ROOM_REFERENCE

RESEARCH_ONLY

REJECTED_DUPLICATE

REJECTED_LICENSE

REJECTED_SECURITY

REJECTED_OBSOLETE

NOT_APPLICABLE

Do not fork everything.

---

# 70. FIRST-PARTY REPOSITORY CREATION

When a genuine independently maintained first-party capability is approved by architecture:

CHECK EXISTING
â†’ CHECK DUPLICATE
â†’ DEFINE BOUNDARY
â†’ ASSIGN NAME
â†’ CREATE REPO RECORD
â†’ CREATE LOCAL REPO
â†’ CREATE PRIVATE GITHUB REPO IF PERMITTED
â†’ SCAFFOLD
â†’ MANIFEST
â†’ TESTS
â†’ PROVENANCE
â†’ TODO
â†’ IMPLEMENT

Examples of possible future repositories:

`poietek-core`

`poietek-audio-engine`

`poietek-midi-engine`

`poietek-mixer`

`poietek-routing`

`poietek-timeline`

`poietek-piano-roll`

`poietek-clip-launcher`

`poietek-sampler`

`poietek-drum-machine`

`poietek-synth-core`

`poietek-plugin-host`

`poietek-plugin-sdk`

`poietek-plugin-lab`

`poietek-score`

`poietek-mastering`

`poietek-podcast`

`poietek-live`

Names are candidates, not automatic final decisions.

Avoid unnecessary fragmentation.

---

# 71. EFFECT REPOSITORIES

Substantial effects should receive individual repositories once implementation begins.

Potential:

`poietek-eq`

`poietek-dynamic-eq`

`poietek-compressor`

`poietek-limiter`

`poietek-gate`

`poietek-deesser`

`poietek-reverb`

`poietek-convolution`

`poietek-delay`

`poietek-modulation`

`poietek-saturation`

`poietek-pitch`

`poietek-timestretch`

`poietek-stereo`

`poietek-metering`

`poietek-denoise`

`poietek-restoration`

Do not create all empty repos before architectural review.

Create/register them as CANDIDATES first.

---

# 72. INSTRUMENT REPOSITORIES

Potential:

`poietek-sampler`

`poietek-drum-machine`

`poietek-subtractive-synth`

`poietek-fm-synth`

`poietek-wavetable-synth`

`poietek-granular-synth`

`poietek-additive-synth`

`poietek-physical-model-synth`

`poietek-modular`

Again:

CANDIDATE
â†’ BOUNDARY REVIEW
â†’ REPOSITORY

---

# 73. THIRD-PARTY FORK VS OUR PRODUCT

Keep these separate.

Example:

External:

`LMMS/lmms`

may be:

REFERENCE_IMPLEMENTATION / FORK / RESEARCH

Our app:

`jayprophit/poietek`

remains our canonical product.

Likewise:

Carla
â†’ plugin-host reference

Poietek Plugin Host
â†’ our product

Surge XT
â†’ synthesis reference

Poietek Synth
â†’ our product

Never disguise upstream source as original first-party technology.

---

# 74. LICENCE AUDIT

MANDATORY.

For each codebase inspect:

LICENSE
COPYING
NOTICE
PATENTS
subdirectory licences
third-party libraries
assets
presets
samples
impulse responses
fonts
themes
icons
models
training data

Record:

SPDX
COMMERCIAL_USE
MODIFICATION
REDISTRIBUTION
SOURCE_OBLIGATION
NETWORK_OBLIGATION
ATTRIBUTION
NOTICE
TRADEMARK
PATENTS
ASSET_LICENSE
MODEL_LICENSE
DATASET_LICENSE

Classify:

PERMISSIVE
WEAK_COPYLEFT
STRONG_COPYLEFT
NETWORK_COPYLEFT
DUAL_LICENSE
COMMERCIAL_OPTION
OPEN_CORE
SOURCE_AVAILABLE
PROPRIETARY
MIXED
UNCLEAR

---

# 75. NO LICENCE CONTAMINATION

Do not paste GPL/AGPL source into a repository intended for incompatible licensing.

When useful GPL code exists but cannot be integrated:

REFERENCE_ONLY

ARCHITECTURAL_REFERENCE

ALGORITHM_RESEARCH

CLEAN_ROOM_REFERENCE

SEPARATE_PROCESS

or

REJECTED_LICENSE

Preserve provenance.

---

# 76. PROJECT FILE / SESSION ARCHITECTURE

Design first-party Poietek session format.

Potential logical entities:

PROJECT
TRACK
CLIP
REGION
TAKE
SOURCE
MIDI
PATTERN
SCENE
PLUGIN
DEVICE
ROUTING
BUS
AUTOMATION
MODULATION
TEMPO
METER
MARKER
ARRANGEMENT
ASSET
STEM
VERSION
RIGHTS
PROVENANCE

Use stable IDs.

Avoid opaque monolithic project blobs where possible.

---

# 77. VERSION / COLLABORATION

Research:

- project snapshots
- autosave
- branches
- versions
- collaboration
- comments
- remote sessions
- conflict resolution
- asset sync
- offline editing
- reconnection

Do not use Git directly for binary audio where unsuitable.

Use appropriate content-addressed/object-storage concepts.

---

# 78. PLUGIN / APP STORE FUTURE

Prepare metadata so Poietek/Aetherius can eventually distribute:

- instruments
- effects
- MIDI effects
- device profiles
- presets
- sample packs
- templates
- themes
- extensions

Do NOT implement payments/public marketplace without owner approval.

---

# 79. OPEN-SOURCE SEED SHORTLIST

At minimum evaluate:

## DAW / SEQUENCING

Ardour  
LMMS  
Zrythm  
Tracktion Engine  
MuseScore  
OpenMPT  
Hydrogen  

## HOST / PLUGIN

Carla  
CLAP  
LV2  
DPF  
iPlug2  
JUCE  
VST3 SDK  

## AUDIO / MIDI I/O

PipeWire  
JACK  
PortAudio  
RtAudio  
RtMidi  
libremidi  

## FILE / DSP

libsndfile  
libsamplerate  
SoXR  
Signalsmith Stretch  
Rubber Band  
SoundTouch  
FFTW  
PFFFT  
aubio  
Essentia  

## SYNTH / SAMPLER

Surge XT  
Dexed  
Odin 2  
Helm  
Vitalium  
Sfizz  
FluidSynth  
DrumGizmo  
Hydrogen  
Yoshimi  
ZynAddSubFX  

## EFFECTS

LSP Plugins  
Calf  
x42 Plugins  
ZamAudio  
ChowDSP  
Guitarix  
Dragonfly Reverb  
Airwindows  
DISTRHO Ports  

## SOURCE SEPARATION / ML AUDIO

Demucs  
Open-Unmix  
Spleeter  
other current legitimate projects

Verify every canonical repository before use.

---

# 80. DO NOT TRUST SEED NAMES BLINDLY

Some projects use:

GitHub mirrors
GitLab
self-hosted Git
SourceForge
organisation migrations

Determine:

CANONICAL_UPSTREAM
GITHUB_MIRROR
CURRENT_MAINTAINER
CURRENT_LICENSE
CURRENT_RELEASE

Do not fork an abandoned mirror when active upstream exists elsewhere.

---

# 81. REQUIRED RESEARCH OUTPUTS

Create under:

`OPENCODE_DATA_ROOT\Poietek-Audio-Research\`

At minimum:

01_DAW_PRODUCT_REGISTRY

02_DAW_CAPABILITY_MATRIX

03_DAW_WORKFLOW_TAXONOMY

04_AUDIO_ENGINE_REGISTRY

05_MIDI_ENGINE_REGISTRY

06_PLUGIN_FORMAT_REGISTRY

07_PLUGIN_HOST_REGISTRY

08_DSP_LIBRARY_REGISTRY

09_EFFECT_TAXONOMY

10_EFFECT_REPOSITORY_REGISTRY

11_SYNTHESIS_ENGINE_REGISTRY

12_INSTRUMENT_REPOSITORY_REGISTRY

13_SAMPLER_FORMAT_REGISTRY

14_AUDIO_FORMAT_REGISTRY

15_HARDWARE_INTEGRATION_MAP

16_CONTROL_SURFACE_REGISTRY

17_SYNC_REGISTRY

18_PROJECT_INTERCHANGE_REGISTRY

19_AUDIO_ANALYSIS_REGISTRY

20_SOURCE_SEPARATION_REGISTRY

21_SPATIAL_AUDIO_REGISTRY

22_AUDIO_DATASET_REGISTRY

23_AUDIO_BENCHMARK_REGISTRY

24_LICENSE_REGISTER

25_FORK_SHORTLIST

26_DEPENDENCY_SHORTLIST

27_FIRST_PARTY_REPOSITORY_PLAN

28_PLUGIN_REPOSITORY_PLAN

29_INSTRUMENT_REPOSITORY_PLAN

30_EFFECT_REPOSITORY_PLAN

31_EXTENSION_REPOSITORY_PLAN

32_POIETEK_ARCHITECTURE_MAP

33_UNIVERSAL_BRIDGE_INTEGRATION_MAP

34_GENESIS_INTEGRATION_MAP

35_AGENT_BRIDGE_INTEGRATION_MAP

36_RIGHTS_INTEGRATION_MAP

37_PROVENANCE_REGISTER

38_REQUIREMENT_REGISTRY

39_IMPLEMENTATION_PRIORITY

40_FOLLOW_ON_TODOS

---

# 82. REPOSITORY EVALUATION FIELDS

For every external candidate record:

NAME
CANONICAL_UPSTREAM
CANONICAL_HOST
MIRROR
PURPOSE
DOMAIN
LANGUAGE
BUILD_SYSTEM
PLATFORMS
ARCHITECTURE
FEATURES
PLUGIN_FORMATS
AUDIO_BACKENDS
MIDI
API
SDK
DOCUMENTATION
TESTS
LAST_ACTIVITY
LATEST_RELEASE
REPO_SIZE
DEPENDENCIES
LICENCE
SUBLICENSES
ASSET_LICENSES
COMMERCIAL_USE
COPYLEFT
INTEGRATION_MODE
POIETEK_VALUE
UNIVERSAL_BRIDGE_VALUE
GENESIS_VALUE
ALREADY_OWNED
DUPLICATE
FORK_RECOMMENDATION
REASON
LAST_VERIFIED

---

# 83. PRIORITISATION

Score:

OWNER_VALUE
MUSIC_PRODUCTION_VALUE
CROSS_PROJECT_REUSE
INTEROPERABILITY
AUDIO_QUALITY
REAL_TIME_SUITABILITY
MATURITY
DOCUMENTATION
MAINTENANCE
CROSS_PLATFORM
RESOURCE_COST
IMPLEMENTATION_COST
LICENCE_COMPATIBILITY
COMMUNITY
HARDWARE_VALUE
FUTURE_VALUE

Assign:

P0_FOUNDATION
P1_CORE
P2_PROFESSIONAL
P3_ADVANCED
P4_SPECIALIST
P5_RESEARCH

---

# 84. PROPOSED FOUNDATION PRIORITY

Evaluate approximately:

P0:

- audio I/O
- audio graph
- MIDI engine
- project model
- transport
- timeline
- routing
- mixer
- plugin host
- waveform
- file I/O
- latency
- basic DSP
- crash recovery
- Universal-Bridge contract

then:

P1:

- piano roll
- pattern engine
- sampler
- automation
- modulation
- effects
- plugin API
- hardware mapping

then:

P2:

- advanced instruments
- clip launcher
- score
- mastering
- spatial
- restoration
- collaboration
- advanced AI

Do not treat this provisional order as immutable if research proves a better dependency order.

---

# 85. CRITICAL PATH PROTECTION

Existing programme critical path remains:

Agent Bridge
â†’ Aetherius IDE
â†’ Genesis proof
â†’ deeper Aetherius integration

Poietek audio research can continue safely in parallel.

Do not interrupt critical-path development simply to compile dozens of DAWs.

---

# 86. IMPLEMENTATION STATUS LAW

Repository exists != implementation.

Fork exists != integration.

Research exists != functionality.

Use:

DISCOVERED
RESEARCHED
EVALUATED
SELECTED
PLANNED
REPOSITORY_CREATED
IMPLEMENTED
TESTED
INTEGRATION_VERIFIED
RUNTIME_VERIFIED
OWNER_TESTABLE
OWNER_ACCEPTED

Apply existing global rule:

ðŸŸ¡ â†’ BUILD â†’ TEST â†’ RUNTIME VERIFY â†’ ðŸŸ¢

âŒ â†’ DIAGNOSE â†’ FIX â†’ BUILD â†’ TEST â†’ RUNTIME VERIFY â†’ ðŸŸ¢

Never fake green.

---

# 87. FINAL OWNER REPORT

After research/evaluation provide Jonathan with:

## A. COMPLETE DAW LANDSCAPE

All major DAW families and useful capabilities.

## B. POIETEK FEATURE MAP

Capability-by-capability first-party mapping.

## C. BEST OPEN DAW REPOSITORIES

Rank:

HIGH
MEDIUM
LOW

## D. BEST AUDIO ENGINE TECHNOLOGY

## E. BEST MIDI TECHNOLOGY

## F. BEST PLUGIN HOST TECHNOLOGY

## G. BEST PLUGIN STANDARDS

## H. BEST DSP LIBRARIES

## I. BEST SYNTH REPOSITORIES

## J. BEST SAMPLER TECHNOLOGY

## K. BEST EFFECT REPOSITORIES

## L. BEST AUDIO ANALYSIS TECHNOLOGY

## M. BEST STEM-SEPARATION TECHNOLOGY

## N. BEST DATASETS

## O. BEST AUDIO BENCHMARKS

## P. LICENCE RISKS

## Q. REPOSITORIES ALREADY OWNED

## R. NEW EXTERNAL FORKS RECOMMENDED

Do not duplicate existing forks.

## S. DEPENDENCIES NOT WORTH FORKING

## T. FIRST-PARTY POIETEK REPOSITORIES REQUIRED

Apps
Engines
Plugins
Effects
Instruments
Extensions
SDKs
Tools

## U. PRIVATE REPOSITORIES CREATED

## V. LOCAL-ONLY REPOSITORIES

## W. REMOTE_CREATION_BLOCKED ITEMS

## X. UNIVERSAL-BRIDGE INTEGRATION

## Y. GENESIS / AGENT BRIDGE INTEGRATION

## Z. RECOMMENDED IMPLEMENTATION ORDER

and generate the resulting persistent TODO tree.

---

# 88. FINAL ARCHITECTURAL PRINCIPLE

The target is NOT:

50 cloned DAWs
+
500 random plugins.

The target is:

POIETEK
â”‚
â”œâ”€â”€ UNIFIED PROJECT MODEL
â”œâ”€â”€ AUDIO ENGINE
â”œâ”€â”€ MIDI ENGINE
â”œâ”€â”€ TIMELINE
â”œâ”€â”€ PATTERN ENGINE
â”œâ”€â”€ CLIP ENGINE
â”œâ”€â”€ MIXER
â”œâ”€â”€ ROUTING
â”œâ”€â”€ AUTOMATION
â”œâ”€â”€ MODULATION
â”œâ”€â”€ PLUGIN HOST
â”œâ”€â”€ PLUGIN SDK
â”œâ”€â”€ SAMPLER
â”œâ”€â”€ SYNTHESIS
â”œâ”€â”€ EFFECTS
â”œâ”€â”€ MASTERING
â”œâ”€â”€ PODCAST
â”œâ”€â”€ LIVE/PERFORMANCE
â””â”€â”€ HARDWARE WORKSPACES
        â”‚
        â–¼
UNIVERSAL-BRIDGE

with:

GENESIS
â†’ intelligence

AGENT BRIDGE
â†’ bounded execution

AETHERIUS OS
â†’ parent platform

and independent repositories for substantial first-party:

APPS
PLUGINS
EXTENSIONS
INSTRUMENTS
EFFECTS
ENGINES
SDKs
ADAPTERS
TOOLS.

Study the strongest ideas from FL Studio, Cubase, Pro Tools, Reason, GarageBand, Logic, Ableton, Bitwig, REAPER, Studio One, MPC, Maschine and the wider DAW ecosystem.

Study legitimate open-source projects deeply.

Reuse open standards and compatible libraries.

Preserve provenance.

Respect licences.

Build original first-party technology.

The final system should be capable of being both:

BEGINNER ACCESSIBLE

and

PROFESSIONALLY DEEP,

while remaining:

LOCAL/OFFLINE-FIRST
CROSS-PLATFORM
HARDWARE-AGNOSTIC
EXTENSIBLE
INTEROPERABLE
PRIVACY-PRESERVING
OWNER-CONTROLLED.
:::

The repository seeds above also give OpenCode useful contrasting architectures to study: LMMS already combines sequencing, piano roll, mixer and built-in instruments; Tracktion Engine exposes a higher-level sequencing/audio application engine but has important GPL/commercial licensing considerations; Carla demonstrates multi-format plugin hosting and patchbay routing; and Zrythm currently supports VST3, CLAP, LV2, LADSPA and AU in its architecture. citeîˆ‚turn284932search5îˆ‚turn284932search0îˆ‚turn289525search0îˆ‚turn289525search3

That should fold cleanly into the **Poietek + Universal-Bridge work you already established**, rather than accidentally creating a second unrelated music platform.
