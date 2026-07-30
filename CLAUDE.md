@AGENTS.md
# IIUM Percussion Club Management System

## Project Vision

Develop a modern web application for the IIUM Percussion Club.

The application has two distinct experiences:

1. Public Website
2. Member Management Portal

The public website represents the club professionally.

The member portal manages club operations.

The project should look and feel like a modern startup website while functioning as a complete management system.

---

# Design Inspiration

The public website is inspired by https://pprx.team/

Use it only as UI/UX inspiration.

Do NOT copy assets, logos, images, branding, or exact layouts.

Create an original design with its own identity.

---

# Technology Stack

Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

Backend
- Supabase

Database
- PostgreSQL

Authentication
- Supabase Auth

Storage
- Supabase Storage

Deployment
- Vercel

Version Control
- GitHub

Development
- Docker

---

# User Roles

## Visitor

Can:

- Browse the website
- View About
- View Gallery
- View Events
- View Committee
- Contact the club
- Login

---

## Member

Can:

- Login
- View Dashboard
- View Instruments
- Request Borrowing
- View Borrow History
- Upload Return Images
- Report Damages
- View Announcements

---

## Admin

Can:

- Everything Member can do

Plus:

- Manage Instruments
- Manage Members
- Approve Borrow Requests
- Reject Borrow Requests
- Manage Gallery
- Manage Events
- View Reports
- Update Instrument Status

---

# Public Website Pages

/
Landing Page

/about

/gallery

/events

/committee

/contact

/login

---

# Member Portal

/dashboard

/profile

/instruments

/my-borrowings

/my-requests

/announcements

---

# Admin Portal

/admin

/admin/instruments

/admin/members

/admin/requests

/admin/events

/admin/gallery

/admin/reports

/admin/settings

---

# UI Guidelines

The design should be:

Modern

Minimal

Elegant

Responsive

Professional

Use whitespace effectively.

Avoid clutter.

Animations should be subtle.

Every page must work on desktop and mobile.
## Brand Identity

The website represents the IIUM Percussion Club.

The supplied club logo uses:
- White
- Black
- Gold
- Grey

The overall interface must feel:
- Clean
- Elegant
- Premium
- Minimal
- Artistic
- Professional

### Colour Palette

- Background: #FFFFFF
- Soft Background: #F8F8F6
- Primary Gold: #C8A928
- Dark Gold: #9E8217
- Primary Text: #111111
- Secondary Text: #666666
- Border: #E8E8E8

Gold should be used as an accent, not as the main background colour.

Avoid:
- Heavy gradients
- Bright colours
- Excessive shadows
- Overly rounded components
- Crowded layouts

### Typography

Use an elegant serif font for major headings.

Preferred heading fonts:
- Playfair Display
- Cormorant Garamond

Use a clean sans-serif font for body text.

Preferred body font:
- Inter

### Logo

The club logo will be stored in:

public/images/percussion-club-logo.jpg

Use the logo in:
- Public navbar
- Login page
- Footer
- Authentication portal where appropriate

Do not distort, recolour or redraw the logo.

Maintain its original aspect ratio.
---

# Component Rules

Always build reusable components.

Example:

Navbar

Footer

Hero

Button

Card

Section

Modal

Table

Badge

Do not duplicate components.

---

# Coding Standards

Use TypeScript.

Use App Router.

Prefer Server Components.

Use Client Components only when necessary.

Use async/await.

Use clean folder structures.

Do not hardcode values.

Never expose secrets.

Keep functions small.

Write readable code.

---

# Folder Structure

app/

components/

lib/

hooks/

types/

utils/

public/

---

# Database

Use Supabase PostgreSQL.

Never write raw SQL inside components.

Keep database logic separated.

---

# Git Workflow

Create small commits.

Meaningful commit messages.

Never delete existing working code without permission.

---

# Claude Instructions

Before generating code:

Explain what will be created.

List affected files.

Do not modify unrelated files.

After generating code:

Explain what was changed.

Explain why.

If a better architecture exists, recommend it before coding.

Always prioritize maintainability over speed.