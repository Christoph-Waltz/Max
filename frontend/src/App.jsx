import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './index.css';
import Home from "./pages/Home";
import Models from "./pages/Models";
import Scenes from "./pages/Scenes";
import Scene from "./pages/Scene";
import Model from "./pages/Model";
import ScrollToTop from "./components/ScrollToTop";
import { ModalProvider } from "./contexts/ModelContext";

function App() {
  return (
    <ModalProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/model/:name" element={<Model />} />
          <Route path="/scene/:id" element={<Scene />} />
          <Route path="/models" element={<Models />} />
          <Route path="/scenes" element={<Scenes />} />
        </Routes>
      </Router>
    </ModalProvider>
  );
}

export default App;