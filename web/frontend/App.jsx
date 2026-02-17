import { BrowserRouter, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavMenu } from "@shopify/app-bridge-react";
import { ToastContainer } from "react-toastify"
import Routes from "./Routes";

import { QueryProvider, PolarisProvider } from "./components";
import Tradein from "./pages/Tradein";
import TradeInRules from "./pages/TradeInRules";
import Test from "./pages/Test";
import { useEffect, useState } from "react";
import { ContextAuth } from "./contextApi/contextAuth";
import HomePage from "./pages";
import Settings from "./pages/Settings";

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.glob("./pages/**/!(*.test.[jt]sx)*.([jt]sx)", {
    eager: true,
  });
  const { t } = useTranslation();

  const [store, setStore] = useState({});
  const [tradeInReq, setTradeInRequests] = useState([]);

  console.log(store, "<<<< app.jsx store")

  const getStore = async () => {
    try {
      const response = await fetch('/api/store-info');
      const data = await response.json();
      setStore({ ...data });
      console.log("Store Data", data);
    } catch (error) {
      console.error('Error fetching store info:', error);
    }
  };

  useEffect(() => {
    getStore();
  }, []);

  return (
    <PolarisProvider>
      <ContextAuth.Provider value={{ store, setStore, tradeInReq, setTradeInRequests }}>
        <BrowserRouter>
          <QueryProvider>
            <NavMenu>
              <Link to="/" element={<HomePage />} >Dashboard</Link>
              <Link to="/tradein" element={<Tradein />} >TradeIn</Link>
              <Link to="/settings" element={<Settings />} >Settings</Link>
              {/* <Link to="/tradeinrules" element={<TradeInRules />} >TradeIn Rules</Link> */}
              {/* <Link to="/Test" element={<Test />} >Test</Link> */}
              {/* <Link to="/Home" element={<HomePage />} >Home</Link> */}
              {/* <Link to="/pagename">{t("NavigationMenu.pageName")}</Link> */}
            </NavMenu>
            <Routes pages={pages} />
            <ToastContainer />
          </QueryProvider>
        </BrowserRouter>
      </ContextAuth.Provider>

    </PolarisProvider>
  );
}
