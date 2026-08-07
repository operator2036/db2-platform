# (DB)² — Dung Beetle Database

<div align="center">

**A modern genome and transcriptomics database for *Onthophagus taurus***

*Davidson Lab · Department of Biological Sciences · Mississippi State University*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![Assembly](https://img.shields.io/badge/Assembly-GCF__036711975.1-7c3aed)](https://www.ncbi.nlm.nih.gov/assembly/GCF_036711975.1)
[![iNaturalist](https://img.shields.io/badge/iNaturalist-125819-74ac00)](https://www.inaturalist.org/taxa/125819-Scarabaeinae)
[![Europe PMC](https://img.shields.io/badge/Literature-Europe_PMC-0066cc)](https://europepmc.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-22c55e)](LICENSE)

[**Davidson Lab**](https://davidsonlab-msu.github.io/)

</div>

---

## Overview

**(DB)²** is an open, web-based genome and transcriptomics database for the dung beetle *Onthophagus taurus* (Schreber, 1759) — a model organism for studying the genomic basis of developmental plasticity, sexual selection, and horn polyphenism. The platform centralizes chromosome-level genome assemblies for four species, NCBI and Davidson Lab custom gene annotations, RNA-seq expression datasets, global biodiversity occurrence data, and real-time scientific literature in a single, visually immersive research interface.

*O. taurus* exhibits striking male-limited horn polyphenism, in which large males develop prominent cephalic horns used in combat for female access while small males remain hornless. This conditional strategy has made the species a powerful system for understanding how genomes encode alternative phenotypes, and (DB)² is designed to support this research by making genome-level data accessible at every level of biological inquiry.

---

## Scientific Background

| Feature | Detail |
|---|---|
| **Species** | *Onthophagus taurus* (Schreber, 1759) |
| **Family** | Scarabaeidae |
| **Subfamily** | Scarabaeinae (dung beetles) |
| **NCBI Taxon ID** | 166361 |
| **Research focus** | Horn polyphenism, sexual selection, developmental plasticity, genome evolution |
| **Native range** | Mediterranean Europe, North Africa, Middle East |
| **Introduced range** | North America, Australia |

---

## Species & Genome Assemblies

| Species | Assembly | Level | Size | Annotation |
|---|---|---|---|---|
| *Onthophagus taurus* | GCF_036711975.1 (Otau_3.2) | Chromosome | ~295 Mb | NCBI + Davidson Lab v1 |
| *Onthophagus sagittarius* | Osag_1.3 | Scaffold | ~561 Mb | AUGUSTUS |
| *Digitonthophagus gazella* | Dgaz_1.3 | Scaffold | ~346 Mb | AUGUSTUS |
| *Onthophagus binodis* | Obin_1.0 | Scaffold | ~843 Mb | AUGUSTUS |

All assemblies are hosted on Cloudflare R2 and served to JBrowse 2 via HTTP byte-range requests. No server-side processing required at browse time.

---

## Platform Features

### Scroll-Driven Homepage
A cinematic scroll-animated landing page featuring a frame-by-frame biological dissection sequence: from an intact *O. taurus* beetle rotating on its axis, through progressive exoskeletal transparency and internal anatomy, to a luminous DNA double helix at the genomic level. Built with HTML5 canvas and requestAnimationFrame — no video element, no scroll event listeners.

### Genome Browser
Powered by [JBrowse 2](https://jbrowse.org/jb2/) embedded as a React component. A species dropdown switches between all four assemblies, remounting JBrowse with the correct config for each. All genomic data streams client-side on demand from Cloudflare R2.

**Tracks available:**
- Reference sequence (BgzipFastaAdapter)
- NCBI Gene Annotation Release — *O. taurus* (Gff3TabixAdapter)
- Davidson Lab Custom Annotation v1 — *O. taurus* (Gff3TabixAdapter)
- AUGUSTUS Gene Annotation — *O. sagittarius*, *D. gazella*, *O. binodis* (Gff3TabixAdapter)
- RNA-seq tracks *(coming in v2)*

### Global Distribution Map
Interactive biodiversity map on [Leaflet.js](https://leafletjs.com/) with live [iNaturalist API](https://api.inaturalist.org/v1/docs/) data. Switches between heatmap tiles at low zoom and individual clickable observation markers at zoom ≥ 10, each showing species name, observer, date, quality grade, photo, and direct iNaturalist link. Covers 122,000+ global Scarabaeinae observations.

### Literature Search
Real-time academic search via [Europe PMC](https://europepmc.org) REST API. Server-side Next.js proxy resolves CORS and bot-detection issues. Returns title, authors, year, journal, citation count, abstract, open-access PDF links, and DOI for every result. Default query tuned for *Onthophagus* research. No curation required — newly indexed papers appear automatically.

### Downloads
Genomic data downloads for all four species organized by species and file type: genome assembly FASTA, GTF gene annotations, repeat-masked genome, protein sequences, and nucleotide sequences. All files hosted on Cloudflare R2 with zero egress fees.

### Publications
Curated Davidson Lab publications and dung beetle genomics literature with DOI links and dataset cross-references.

### Directory
Lab directory for the Davidson Lab and four collaborating principal investigators across Boston University, Indiana University, Southwest University, and UC San Diego.

### Gene Search *(v2)*
Filterable, sortable table of 28,456+ predicted gene models with search by gene ID, chromosome, coordinate range, annotation source, and RNA-seq availability.

### Expression Data *(v2)*
RNA-seq datasets linked to biological features including horn development, leg morphology, and developmental stage series.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack React, SSR/SSG, API routing |
| Language | TypeScript 5 | Type-safe development |
| Styling | Tailwind CSS + CSS variables | Dark-theme UI system |
| Genome browser | JBrowse 2 | Multi-species embedded genomic visualization |
| Distribution map | Leaflet.js + iNaturalist API v1 | Biodiversity occurrence mapping |
| Literature | Europe PMC REST API (server-side proxy) | Real-time academic literature search |
| Scroll animation | HTML5 Canvas + rAF | Frame-by-frame beetle dissection hero |
| Cinematic visuals | Higgsfield AI + ffmpeg | Background videos and loading animations |
| File hosting | Cloudflare R2 | Zero-egress genomic file CDN |
| Deployment | Vercel | CI/CD + global edge hosting |

---

## Data Pipeline

All genomic files are preprocessed before deployment to enable efficient byte-range HTTP access in JBrowse.

### Genome FASTA
```bash
# Block-compress with bgzip (required for random access)
bgzip -k genome.fasta

# Generate FASTA index and bgzip block index
samtools faidx genome.fasta.gz
# produces: genome.fasta.gz.fai + genome.fasta.gz.gzi
```

### Annotation Files (GTF / GFF3)
```bash
# Sort by chromosome and start position, then block-compress
sort -k1,1 -k4,4n annotations.gtf | bgzip > annotations.sorted.gtf.gz

# Generate tabix index for coordinate-based random access
tabix -p gff annotations.sorted.gtf.gz
# produces: annotations.sorted.gtf.gz.tbi
```

### Additional Sequence Files (protein, nucleotide, masked)
```bash
# Compress for download hosting (no indexing needed)
bgzip -k proteins.fasta
bgzip -k nucleotides.fasta
bgzip -k masked_genome.fasta
```

All processed files and indexes are hosted on Cloudflare R2 with CORS configured for browser-side byte-range requests:

```json
[{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["Range", "Accept-Ranges", "Content-Range"],
  "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges"],
  "MaxAgeSeconds": 3600
}]
```

---

## Project Structure

```
db2-platform/
├── app/
│   ├── layout.tsx                  # Root layout with navbar
│   ├── page.tsx                    # Scroll-animated homepage
│   ├── components/home/            # Homepage section components
│   │   ├── ScrollHero.tsx          # Canvas-based beetle dissection
│   │   ├── StatsBar.tsx
│   │   ├── SpeciesSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── AssemblyCard.tsx
│   │   └── ClosingCTA.tsx
│   ├── genome-browser/             # Multi-species JBrowse 2 browser
│   ├── distribution/               # iNaturalist map
│   ├── literature/                 # Europe PMC live search
│   ├── publications/               # Curated publications
│   ├── directory/                  # Lab directory
│   ├── downloads/                  # File downloads (4 species)
│   ├── expression/                 # RNA-seq data (v2)
│   ├── genes/                      # Gene search (v2)
│   └── api/
│       └── literature/             # Server-side Europe PMC proxy
│
├── components/
│   ├── genome/
│   │   ├── JBrowseWrapper.tsx      # SSR-safe dynamic import
│   │   ├── JBrowseViewInner.tsx    # JBrowse React component
│   │   └── JBrowseLoader.tsx       # Cinematic loading animation
│   ├── map/
│   │   └── DistributionMap.tsx     # Leaflet + iNaturalist
│   └── site/
│       ├── Navbar.tsx
│       └── Footer.tsx
│
├── lib/
│   └── jbrowse-config.ts           # All 4 species assembly + track configs
│
└── public/
    ├── media/Logo.png
    ├── frames/                     # Beetle dissection animation frames
    ├── loading-frames/             # JBrowse loading animation frames
    ├── genome-bg.mp4               # Genome browser background loop
    ├── publications-bg.mp4         # Publications page header video
    ├── directory-bg.mp4            # Directory page header video
    └── downloads-bg.mp4            # Downloads page header video
```

---

## Local Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
git clone https://github.com/researchingadi/db2-platform.git
cd db2-platform
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Version Roadmap

### v1 — Foundation *(current)*
- [x] Scroll-animated cinematic homepage with beetle dissection sequence
- [x] JBrowse 2 genome browser with 4-species dropdown switcher
- [x] Chromosome assembly + NCBI and Davidson Lab annotation tracks
- [x] Interactive global distribution map (iNaturalist live API)
- [x] Real-time literature search (Europe PMC server-side proxy)
- [x] Publications page with cinematic header
- [x] Lab directory with collaborating PIs and cinematic header
- [x] Downloads page for all 4 species with cinematic header
- [x] Cinematic genome browser background loop
- [x] Premium JBrowse loading animation
- [x] GitHub repository

### v2 — Transcriptomics *(in development)*
- [ ] Deploy to Vercel (live public URL)
- [ ] RNA-seq tracks in JBrowse (BAM/BigWig)
- [ ] Gene search table with multi-field filtering
- [ ] Gene detail pages with mini-browser and expression data
- [ ] Biological feature pages: Horns, Legs, Development, Reproduction
- [ ] Expression heatmap visualizations
- [ ] PostgreSQL database for gene models

### v3 — Advanced Tools
- [ ] BLAST sequence search (NCBI BLAST+, FastAPI)
- [ ] Ortholog search across *Onthophagus* species
- [ ] Additional species support
- [ ] Advanced expression visualizations (volcano plots, PCA)
- [ ] Resource paper publication

---

## Multi-Species Architecture

All genomic data is scoped by species in both the R2 bucket structure and the JBrowse config:

```
R2 bucket: db2-genomics/
├── otaurus/        # O. taurus genome + annotations
├── osagittarius/   # O. sagittarius genome + annotations + sequences
├── dgazella/       # D. gazella genome + annotations + sequences
└── obinodis/       # O. binodis genome + annotations + sequences
```

All four species configs are defined in `lib/jbrowse-config.ts` as `SPECIES_CONFIGS`. Switching species in the browser remounts JBrowse with the correct assembly and tracks via React `key` prop — no page navigation required.

---

## Data Sources & Attribution

| Data | Source | Version / Accession |
|---|---|---|
| *O. taurus* genome assembly | NCBI | GCF_036711975.1 (IU_Otau_3.0) |
| *O. taurus* NCBI annotations | NCBI Annotation Release | GFF3 + GTF |
| *O. taurus* custom annotations | Davidson Lab, MSU | v1 |
| *O. sagittarius* assembly + annotations | Davidson Lab, MSU | Osag_1.3 |
| *D. gazella* assembly + annotations | Davidson Lab, MSU | Dgaz_1.3 |
| *O. binodis* assembly + annotations | Davidson Lab, MSU | Obin_1.0 |
| RNA-seq data | Davidson Lab, MSU | In preparation |
| Biodiversity occurrences | [iNaturalist](https://www.inaturalist.org/taxa/125819-Scarabaeinae) | Live API — Taxon ID 125819 |
| Scientific literature | [Europe PMC](https://europepmc.org) | Live REST API |

---

## Citation

If you use (DB)² or any genome resources from this platform in your research, please cite:

> Davidson Lab (2025). *(DB)² — Dung Beetle Database: a genomic and transcriptomic resource for Onthophagus taurus and related species*. Mississippi State University. https://github.com/researchingadi/db2-platform

**O. taurus genome assembly:**
> NCBI Assembly GCF_036711975.1 — *Onthophagus taurus* IU_Otau_3.0. National Center for Biotechnology Information.

**Biodiversity occurrence data:**
> iNaturalist contributors (2025). *Scarabaeinae* observations. iNaturalist.org. https://www.inaturalist.org/taxa/125819

---

## Team

| Name | Role | Affiliation |
|---|---|---|
| Dr. Philip L. Davidson | Principal Investigator | Mississippi State University |
| Adi Singh | Bioinformatics Full Stack Developer / Research Software Engineer | Mississippi State University |

**Collaborating Principal Investigators:**

| Name | Institution |
|---|---|
| Dr. Sofía Casasa | Boston University |
| Dr. Yonggang Hu | Southwest University |
| Dr. Armin Moczek | Indiana University |
| Dr. Patrick Rohner | University of California San Diego |

---

## Contact

- **Lab website:** [davidsonlab-msu.github.io](https://davidsonlab-msu.github.io/)
- **GitHub Issues:** [researchingadi/db2-platform/issues](https://github.com/researchingadi/db2-platform/issues)
- **Department:** Biological Sciences, Mississippi State University

---

## License

MIT License — see [LICENSE](LICENSE) for details.

Genomic data is sourced from NCBI and subject to [NCBI data use policies](https://www.ncbi.nlm.nih.gov/home/about/policies/).
Biodiversity occurrence data is sourced from iNaturalist and subject to [iNaturalist terms of use](https://www.inaturalist.org/terms).
Literature data is sourced from Europe PMC and subject to [Europe PMC terms of use](https://europepmc.org/terms).
