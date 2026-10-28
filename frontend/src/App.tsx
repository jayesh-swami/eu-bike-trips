import { Route, Routes } from 'react-router'
import MapPage from './pages/MapPage.tsx'

export default function App() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-6 border-b border-slate-200 bg-white px-4 py-2">
        <h1 className="text-base font-semibold">EU Bike Trips</h1>
        <a
          href="http://localhost:8080/graphiql"
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-sm text-slate-600 hover:underline"
        >
          GraphiQL ↗
        </a>
      </header>
      <main className="min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<MapPage />} />
        </Routes>
      </main>
    </div>
  )
}
