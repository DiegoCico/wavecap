import logo from './logo.svg';
import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import TestServer from './components/ServerTest';
import AuthPage from './pages/Auth';
import Homepage from './pages/Homepage';
import Temp from './pages/temp'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='server-test' element={<TestServer />} />
        <Route path='/' element={<AuthPage/>}/>
        <Route path='/home/:uid' element={<Homepage/>}/>
        <Route path='/temp' element={<Temp/>}/>
      </Routes>
    </div>
  );
}

export default App;
