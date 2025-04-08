
import React, { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
  containerClassName?: string;
  withPadding?: boolean;
}

const PageLayout = ({ 
  children, 
  containerClassName = "", 
  withPadding = true 
}: PageLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-1 container ${withPadding ? 'py-8' : ''} ${containerClassName}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;
