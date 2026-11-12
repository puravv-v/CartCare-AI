# CartCare AI 🛍️

### AI-Powered E-Commerce Customer Support Assistant

CartCare AI is an AI-powered customer support platform designed to simplify e-commerce support operations. Built using **Next.js, Supabase, and Google Gemini**, it helps customers track orders, check return eligibility, submit return requests, and escalate unresolved issues to human support through a conversational AI assistant.

It also provides a dedicated admin dashboard where support teams can monitor tickets, prioritize issues, and manage their resolution status.

---

## 🚀 Features

### 👤 Customer Portal

- **AI Support Chat:** Interact with an AI assistant using natural language.
- **Order Tracking:** Retrieve real-time order information, delivery status, courier details, and tracking numbers from the database.
- **Return Eligibility:** Automatically check whether an order qualifies for a return based on delivery status and the product's return window.
- **Return Requests:** Submit return requests directly through the AI assistant.
- **Human Escalation:** Escalate unresolved or urgent customer issues to human support.
- **My Orders:** View order history and associated products.
- **My Returns:** Track submitted return requests and their statuses.
- **My Support Tickets:** View support tickets raised by the customer.

### 🛠️ Admin Portal

- **Admin Dashboard:** Centralized support ticket management.
- **Ticket Overview:** Monitor total, open, in-progress, and resolved tickets.
- **Ticket Management:** View customer details, issue descriptions, and associated order IDs.
- **Priority Management:** Set ticket priorities to Low, Medium, or High.
- **Status Management:** Update tickets to Open, In Progress, or Resolved.
- **Ticket Filtering:** Filter tickets by status and priority.
- **Independent Authentication:** Separate admin login and session management.

---

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Full-stack React framework |
| React | Frontend user interface |
| TypeScript | Type-safe development |
| Tailwind CSS | UI styling |
| Supabase | PostgreSQL database and backend |
| Google Gemini | AI-powered conversational agent |
| Google GenAI SDK | Gemini model integration |
| Zod | Input validation |
| Vercel | Deployment platform |

---

## 🏗️ Architecture

CartCare AI follows a tool-based AI agent architecture.

1. The customer sends a natural-language message through the support chat.
2. The Next.js API sends the conversation to the Gemini-powered agent.
3. Gemini determines which backend tool is required.
4. The selected tool performs the required database operation through Supabase.
5. The result is returned to the AI agent.
6. The agent generates a natural-language response for the customer.

### AI Agent Tools

| Tool | Description |
|---|---|
| `getMyOrders` | Retrieves the customer's recent orders |
| `getOrderDetails` | Retrieves details of a specific order |
| `checkReturnEligibility` | Checks whether a product qualifies for return |
| `createReturnRequest` | Creates a return request |
| `escalateToHuman` | Creates a support ticket for human assistance |

Write operations are validated on the server before database changes are made.

---

## 📁 Project Structure

```text
CartCare-AI/
│
├── app/
│   ├── admin/
│   │   ├── login/
│   │   └── tickets/
│   ├── api/
│   │   ├── admin/
│   │   ├── agent/
│   │   ├── login/
│   │   ├── orders/
│   │   ├── returns/
│   │   └── support-tickets/
│   ├── login/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── AgentChat.tsx
│   ├── OverviewDashboard.tsx
│   ├── OrdersPanel.tsx
│   ├── ReturnsPanel.tsx
│   └── SupportTicketsPanel.tsx
│
├── lib/
│   ├── agent/
│   │   ├── customerContext.ts
│   │   ├── defineTool.ts
│   │   ├── runAgent.ts
│   │   ├── systemPrompt.ts
│   │   ├── tools.ts
│   │   └── types.ts
│   ├── auth.ts
│   ├── dates.ts
│   ├── env.ts
│   ├── gemini.ts
│   ├── schemas.ts
│   └── supabase.ts
│
├── seed/
│   └── ps1_ecommerce_support.sql
│
├── proxy.ts
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js (LTS recommended)
- npm
- Git
- A Supabase project
- A Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/puravv-v/CartCare-AI.git
cd CartCare-AI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root.

Copy the structure from `.env.example` and fill in your own credentials.

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash

SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_supabase_secret_key

APP_PASSCODE=your_customer_passcode
APP_ADMIN_PASSCODE=your_admin_passcode
```

**Important:** Never commit `.env.local` or expose your Gemini API key and Supabase secret key in frontend code.

### 4. Set up Supabase

1. Create a new project in Supabase.
2. Open the SQL Editor.
3. Execute the SQL script from:

```text
seed/ps1_ecommerce_support.sql
```

4. Configure the Supabase project URL and secret key in `.env.local`.

The seed script creates the customer, product, order, order item, return, and support ticket tables along with sample data.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run typecheck` | Run TypeScript checks |

---

## 💬 Example Customer Queries

Try these prompts in the customer support chat:

**Order Tracking**
> Where is my order 1003?

**Return Request**
> I want to return the shoes from my last order, they are too small.

**Human Escalation**
> My order is 4 days late and nobody is answering.

The AI agent uses backend tools to retrieve order information, validate return eligibility, create return requests, and escalate issues when necessary.

---

## 🔐 Security

- Separate customer and administrator authentication.
- Server-side session validation.
- Customer-specific data access restrictions.
- Server-side Supabase operations.
- Input validation using Zod.
- Restricted admin ticket management APIs.
- Environment secrets excluded from version control.

---

## 🛣️ Future Improvements

- Real customer authentication and account registration.
- Live courier tracking integrations.
- Email and WhatsApp notifications.
- Advanced analytics for support operations.
- AI-powered ticket categorization and response suggestions.
- Automated order cancellation where business rules permit.

---

## 👨‍💻 Author

**Purav Agarwal**

- GitHub: [@puravv-v](https://github.com/puravv-v)
- LinkedIn: [Purav Agarwal](https://www.linkedin.com/in/purav-agarwal-9a95a4351/)

---

⭐ If you find this project interesting, consider giving it a star!

**CartCare AI — Smarter Support. Happier Customers.**