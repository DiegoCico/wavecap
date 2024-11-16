import logo from './logo.svg';
import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import TestServer from './components/ServerTest';
import AuthPage from './pages/Auth';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='server-test' element={<TestServer />} />
        <Route path='/' element={<AuthPage/>}/>
      </Routes>
    </div>
  );
}

export default App;
