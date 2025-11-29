## Running live webapp: 
visit [howcookedareyou.vercel.app](https://howcookedareyou.vercel.app) 

## Overview: How Cooked Are You?
How Cooked Are You? is a web application built for the UBC CS community to calculate how “cooked” a student is based on their upcoming academic workload, but in a fun, chaotic, relatable way. Instead of just telling you you’re doomed… it actually *helps you get uncooked.* 

### What the app does
Users can enter details about their upcoming assignments, including:
- Assignment names
- Weightings
- Due dates
- Import their current schedule through an .ics file
  
The app then:
- Generates a study schedule automatically
- Exports the schedule as an .ics calendar file, ready to import to Google Calendar / Apple Calendar / Outlook
- Assigns a “How cooked are you?” score

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

