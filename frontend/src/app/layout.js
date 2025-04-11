import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import LoadUser from '../../helper/load_user';
import Navbar from '../components/navbar';

export const metadata = {
  title: 'Task Manager',
  description: 'A simple task management app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}