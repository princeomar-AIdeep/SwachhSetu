import { Link } from 'react-router-dom';
import { Logo } from '../components/ui.jsx';
export default function NotFound() {
  return <div className="grid min-h-screen place-items-center p-6 text-center"><div><Logo className="mx-auto h-28" /><h1 className="mt-4 text-5xl">404</h1><p className="text-mute">This page has been recycled.</p><Link to="/" className="btn btn-primary mt-4">Back home</Link></div></div>;
}
