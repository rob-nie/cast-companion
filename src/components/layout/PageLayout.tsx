
import { ReactNode } from "react";
import Navbar from "./Navbar";

type PageLayoutProps = {
  children: ReactNode;
  withPadding?: boolean;
};

const PageLayout = ({ children, withPadding = true }: PageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-1 flex flex-col ${withPadding ? 'container p-4 md:p-6' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
