import { Routes, Route } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { InfoPage } from "./InfoPage";
import { HomePage } from "./HomePage";
import { FavoritesPage } from "./FavoritesPage";
import { TeamPage } from "./TeamPage";
import { GamePage } from "./GamePage";
import { ComparePage } from "./ComparePage";
import { ItemsPage } from "./ItemsPage";
import PokedexPage from "./PokedexPage";
import { FavoritesProvider } from "./context/FavoritesContext";
import { TeamProvider } from "./context/TeamContext";
import { ThemeProvider } from "./context/ThemeContext";
import Notification from "./components/Notification";

/* Import organized CSS modules */
import "./styles/index.css";

const App = () => {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <TeamProvider>
          <Header />
          <main>
            <Routes>
              <Route path={"/"} element={<HomePage />} />
              <Route path={"/info"} element={<InfoPage />} />
              <Route path={"/pokedex"} element={<PokedexPage />} />
              <Route path={"/favorites"} element={<FavoritesPage />} />
              <Route path={"/team"} element={<TeamPage />} />
              <Route path={"/game"} element={<GamePage />} />
              <Route path={"/compare"} element={<ComparePage />} />
              <Route path={"/items"} element={<ItemsPage />} />
            </Routes>
          </main>
          <Footer />
          <Notification />
        </TeamProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
};

export default App;