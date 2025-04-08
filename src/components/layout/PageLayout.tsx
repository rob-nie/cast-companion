
import React, { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
  containerClassName?: string;
}

const PageLayout = ({ children, containerClassName = "" }: PageLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-1 container py-8 ${containerClassName}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;
