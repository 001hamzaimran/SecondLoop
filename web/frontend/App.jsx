import { BrowserRouter, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavMenu } from "@shopify/app-bridge-react";
import { ToastContainer } from "react-toastify"
import Routes from "./Routes";

import { QueryProvider, PolarisProvider } from "./components";
import Tradein from "./pages/Tradein";
import TradeInRules from "./pages/TradeInRules";

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.glob("./pages/**/!(*.test.[jt]sx)*.([jt]sx)", {
    eager: true,
  });
  const { t } = useTranslation();

  return (
    <PolarisProvider>
      <BrowserRouter>
        <QueryProvider>
          <NavMenu>
            <Link to="/" rel="home" />
            <Link to="/tradein" element={<Tradein />} >TradeIn</Link>
            <Link to="/tradeinrules" element={<TradeInRules />} >TradeIn Rules</Link>
            {/* <Link to="/Home" element={<HomePage />} >Home</Link> */}
            {/* <Link to="/pagename">{t("NavigationMenu.pageName")}</Link> */}
          </NavMenu>
          <Routes pages={pages} />
          <ToastContainer />
        </QueryProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
