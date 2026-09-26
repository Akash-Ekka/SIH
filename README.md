# SAKSHYA

Digital Evidence & Chain of Custody System.

## Project Structure

```text
SAKSHYA/
├── index.html
├── styles.css
├── app.js
├── server.js
├── App.jsx
├── package.json
└── README.md
```

## Technologies

- HTML5 / semantic structure
- Tailwind CSS CDN
- Custom CSS / glassmorphism / animations
- Vanilla JavaScript ES6+
- WebCrypto SHA-256
- Node.js
- Express
- JWT
- React / JSX source component

## Run

1. Open Terminal inside the SAKSHYA folder.

2. Install dependencies:

```bash
npm install
```

3. Start the backend:

```bash
npm start
```

4. Open:

```text
http://localhost:4000
```

## Development

```bash
npm run dev
```

The Source Workspace reads the separate project files through:

```text
GET /api/source/:file
```

This keeps the displayed source synchronized with the actual files instead of embedding duplicate copies of the code inside `index.html`.
