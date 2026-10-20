import { Navigate, Route, Routes } from 'react-router-dom';
import BoardsListPage from '../pages/BoardsListPage.jsx';
import BoardDetailPage from '../pages/BoardDetailPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

/**
 * Matriz de rutas. (docs/SPEC.md §5, AGENTS.md §5)
 * Sin autenticación: todo es público.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/boards" replace />} />
      <Route path="/boards" element={<BoardsListPage />} />
      <Route path="/boards/:boardId" element={<BoardDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
