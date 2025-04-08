
import { ReactNode } from "react";
import Navbar from "./Navbar";

type PageLayoutProps = {
  children: ReactNode;
  withPadding?: boolean;
};

const PageLayout = ({ children, withPadding = true }: PageLayoutProps) => {
  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <main className={`flex-1 ${withPadding ? 'container p-4 md:p-6' : ''} overflow-auto`}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
