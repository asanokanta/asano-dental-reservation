import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Reserve from "./pages/Reserve";
import Admin from "./pages/Admin";
import Booking from "./pages/Booking";
import LiffReserve from "./pages/LiffReserve";
import Faq from "./pages/Faq";
import LiffCheck from "./pages/LiffCheck";
import Privacy from "./pages/Privacy";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/booking"} component={Booking} />
      <Route path={"/liff-reserve"} component={LiffReserve} />
      <Route path={"/liff-check"} component={LiffCheck} />
      <Route path={"/privacy"} component={Privacy} />
      <Route path={"/faq"} component={Faq} />
      <Route path={"/reserve"} component={Reserve} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
