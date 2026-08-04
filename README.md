# StageMate Pro

Act as a Principal Full-Stack Engineer and UX Designer. Build a SaaS application named "StageDocs" (or "HubMusico") tailored for independent musicians, bands, music educators, and managers in Brazil. The app simplifies, automates, and organizes all legal, technical, and bureaucratic documentation required for live shows, public funding grants (editais), music education, and copyright management.



---



### 1. DESIGN SYSTEM & UI/UX DIRECTION

- **Vibe:** Professional, modern, artist-friendly, high-contrast, clean.

- **Color Palette:** Dark Mode default (Deep Slate/Zinc `#09090B`, Accent Neon Violet `#8B5CF6` or Electric Cyan `#06B6D4`).

- **Typography:** Sans-serif, highly legible (Inter or Plus Jakarta Sans).

- **Navigation:** Left sidebar (collapsible) with access to Overview Dashboard, Document Generator, Clipping Vault, Show/Project Tracker, and Settings.



---



### 2. CORE MODULES & DATA STRUCTURE



#### A. Central Profile & Entity Vault ("Single Source of Truth")

- **Artist/Band Profile:** Stage Name, Legal Name, CPF/CNPJ (MEI/EIRELI/LTDA), Inscrição Municipal/Estadual, Address, Bank Details (PIX keys).

- **MEI & Fiscal Info:** Support for musical CNAEs (e.g., 9001-9/02 - Atividades de músicos, 9001-9/01, 8592-9/03 - Ensino de música).

- **Team & Crew Roster:** List of fixed band members, side-musicians, roadies, audio/light engineers (Name, Role, CPF, PIS/PASEP, RG, Chave PIX, Food Restrictions).

- **ECAD & Rights Profile:** Association registration (UBC, ABRAMUS, AMAR, etc.), CAE/IPI Number, ECAD Client Number.



#### B. Dynamic Document Generator (Form to PDF)

Create interactive forms that auto-fill using the Central Profile and generate clean, exportable, and print-ready PDFs for:

1. **Performance Contracts (Show/Eventos):**

   - Private Event / Venue Performance Contract.

   - Clauses for: Cachê breakdown, payment dates (Sinal + Remanescente), W.O. / Weather cancellations, Overtime rules, Soundcheck limits, and ECAD/Tax payment responsibility.

2. **Technical & Logistical Riders:**

   - **Stage Map (Mapa de Palco):** Visual grid or dynamic drag-and-drop input to position instruments, amps, and power drops.

   - **Input List / Channel List:** Table (Channel, Instrument, Mic/DI, Stand Type, Phantom Power +48V).

   - **Rider Técnico & Camarim:** Sound/Lighting requirements, backline list, hospitality/catering list, rooming list.

3. **Public Grants & Editais (Fomento Público - Lei Rouanet, LPG, PNAB, ProAC):**

   - **Carta de Anuência / Exclusividade:** Formal declaration for producers/managers representing artists for specific projects/dates (com firma reconhecida / assinatura digital).

   - **Termos de Representação e Cessão de Imagem/Voz:** Releases for videographers, side-musicians, and guests.

   - **Declaração de Não Vínculo Empregatício / Regularidade:** Standard templates for grant submissions.

4. **Copyright & Fonográfico:**

   - **Split Sheet:** Agreement on composition/production percentages among co-writers.

   - **Ficha Técnica de Fonograma (ISRC/ISWC Prep):** Song metadata (Title, Genre, Writers, Performers, Percentages, Producer, Studio) ready to submit to ECAD associations.

5. **Education & Services (Aulas e Mentorias):**

   - Student Service Contract (Aulas Particulares / Mentorias).

   - Recibo de Pagamento de Autônomo (RPA) & Simple Invoicing helper.



#### C. ECAD & Setlist Manager

- **Setlist Creator:** Build show setlists selecting songs from a master catalog.

- **Roteiro de Execução ECAD:** Auto-generate the official ECAD setlist document containing Song Name, Composers, Editora, and Duration for show registration.



#### D. Clipping & Portfólio Vault (Comprovação para Editais)

- Organizable repository of past activities categorized by Year/Event.

- Features:

  - Upload & Link attachments (Flyers, Posters, Press Clippings, Ticket Stubs, Video Links).

  - One-click export into a styled "Portfolio PDF" required by cultural grants.



#### E. Project & Show Checklist Center

- Interactive task lists with progress bars and due date reminders:

  - **Pre-Show Checklist:** Contract signed, Deposit received, Rider sent, Technical contact confirmed, Hotel booked.

  - **Post-Show Checklist:** Invoice issued, Remaining payment received, ECAD Setlist sent.

  - **Edital Submission Checklist:** CND Federal, CND Estadual, CND Municipal, CNDT (Trabalhista), FGTS, Portfolio PDF, Budget sheet attached.



---



### 3. TECHNICAL & INTEGRATION SPECIFICATIONS

- **PDF Engine:** Client-side PDF generation (e.g., `@react-pdf/renderer` or `jsPDF` + `html2canvas`) with clean typography and custom branding options.

- **Signatures:** Integration placeholder / UI hooks for Digital Signatures (Gov.br / Clicksign / ZapSign).

- **State Management:** Persistent Local Storage / Supabase integration for user data and saved document drafts.

- **Search & Filters:** Instant search across generated documents, clippings, and team members.



---



### 4. USER FLOW / FIRST TIME ONBOARDING

1. **Onboarding Wizard:** Collects essential artist details (Solo Artist vs. Band, MEI status, ECAD affiliation).

2. **Dashboard Overview:** Displays Quick Actions ("New Show Contract", "Create Rider", "Build Setlist for ECAD", "Export Edital Portfolio"), Upcoming Deadlines, and Document History.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://brasil-music-docs.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/becac8cc-67fa-4df4-b10a-bcabd61ab264).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
