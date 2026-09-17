import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Shell } from '@/components/storefront';
import {
  AccountPage, AddressesPage, AuthPage, CartPage, CheckoutPage, HomePage, ListingPage, OrderDetailPage,
  OrderSuccessPage, OrdersPage, ProductPage, SearchPage, SettingsPage, WishlistPage,
} from '@/pages/storefront';
import { AdminPage, AdminProductsPage } from '@/pages/admin';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Shell>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/shop" component={() => <ListingPage />} />
          <Route path="/search" component={SearchPage} />
          <Route path="/category/:slug" component={() => <ListingPage category={useRouteSlug()} />} />
          <Route path="/product/:slug" component={ProductPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/wishlist" component={WishlistPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/order-success/:id" component={OrderSuccessPage} />
          <Route path="/account" component={AccountPage} />
          <Route path="/account/orders" component={OrdersPage} />
          <Route path="/account/orders/:id" component={OrderDetailPage} />
          <Route path="/account/addresses" component={AddressesPage} />
          <Route path="/account/settings" component={SettingsPage} />
          <Route path="/login" component={() => <AuthPage mode="login" />} />
          <Route path="/signup" component={() => <AuthPage mode="signup" />} />
          <Route path="/forgot-password" component={() => <AuthPage mode="forgot" />} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/admin/products" component={AdminProductsPage} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
    </RoutedErrorBoundary>
  );
}

function useRouteSlug() {
  const [location] = useLocation();
  return location.split('/')[2]?.split('?')[0] || '';
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
