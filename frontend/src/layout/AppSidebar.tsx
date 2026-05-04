import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { fetchCompanies } from "../api/client";

import {
  ChevronDownIcon,
  HorizontaLDots,
  GridIcon,
  CalenderIcon,
  UserCircleIcon,
  ListIcon,
  TableIcon,
  PageIcon,
  PieChartIcon,
  BoxCubeIcon,
  PlugInIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";

// --- Tipos ---
type Company = {
  id: number;
  nombre: string;
  codigo_bbv: string;
  sector: string;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; tooltip?: string }[];
};

// --- Iconos de Sectores (SVG Profesionales) ---
const SectorIcons: Record<string, React.ReactNode> = {
  Agroindustrial: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Industrial: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Comercial: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Servicios: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Financiero: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Energía: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Construcción: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Minero: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v2a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v2a1 1 0 01-1 1h-3a1 1 0 00-1 1v1a2 2 0 11-4 0V4z" />
    </svg>
  ),
  Tecnología: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  Otros: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
};

// --- Configuración Estática ---
const BASE_SECTORS = [
  "Agroindustrial",
  "Industrial",
  "Comercial",
  "Servicios",
  "Financiero",
  "Energía",
  "Construcción",
  "Minero",
  "Tecnología",
  "Otros",
];

const STATIC_NAV: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard Global", path: "/" },
  { icon: <CalenderIcon />, name: "Calendar", path: "/calendar" },
  { icon: <UserCircleIcon />, name: "User Profile", path: "/profile" },
];

const OTHERS_NAV: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart" },
      { name: "Bar Chart", path: "/bar-chart" },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts" },
      { name: "Buttons", path: "/buttons" },
    ],
  },
];

// --- Helpers ---
const cleanCompanyName = (name: string) => {
  if (!name) return "";
  return name
    .replace(/\s+(S\.A\.|S\.R\.L\.|LTDA\.|S\.A\.M\.|INC\.)\b/gi, "")
    .replace(/,+$/, "")
    .trim();
};

const groupCompaniesBySector = (companies: Company[]) => {
  const grouped: Record<string, Company[]> = BASE_SECTORS.reduce((acc, sector) => {
    acc[sector] = [];
    return acc;
  }, {} as Record<string, Company[]>);

  companies.forEach((comp) => {
    const sectorKey = BASE_SECTORS.find(s => s.toLowerCase() === (comp.sector || "").toLowerCase()) || "Otros";
    if (!grouped[sectorKey]) grouped[sectorKey] = [];
    grouped[sectorKey].push(comp);
  });

  return grouped;
};

// --- Componente Principal ---
const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeCompanyId = searchParams.get("company");

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others" | "mercado";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchCompanies();
        setCompanies(data);
      } catch (err) {
        console.error("Error fetching companies", err);
      }
    };
    loadData();
  }, []);

  const marketNavItems: NavItem[] = useMemo(() => {
    const grouped = groupCompaniesBySector(companies);
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sector, sectorCompanies]) => ({
        name: sector,
        icon: SectorIcons[sector] || SectorIcons.Otros,
        subItems: sectorCompanies.length > 0 
          ? sectorCompanies.map(c => ({
              name: cleanCompanyName(c.nombre),
              path: `/?company=${c.id}`,
              tooltip: `${c.codigo_bbv} - ${c.nombre}`,
            }))
          : [{ name: "Sin empresas disponibles", path: "#" }],
      }));
  }, [companies]);

  const isActive = useCallback(
    (path: string) => {
      if (path === "#") return false;
      if (path.includes("company=")) {
        return location.search === path.substring(path.indexOf("?"));
      }
      return location.pathname === path && !location.search;
    },
    [location.pathname, location.search]
  );

  // Auto-abrir sector activo
  useEffect(() => {
    let found = false;
    marketNavItems.forEach((nav, index) => {
      if (nav.subItems?.some(sub => isActive(sub.path))) {
        setOpenSubmenu({ type: "mercado", index });
        found = true;
      }
    });

    if (!found) {
      [STATIC_NAV, OTHERS_NAV].forEach((items, listIdx) => {
        const type = listIdx === 0 ? "main" : "others";
        items.forEach((nav, index) => {
          if (nav.subItems?.some(sub => isActive(sub.path)) || (nav.path && isActive(nav.path))) {
            setOpenSubmenu({ type, index });
          }
        });
      });
    }
  }, [activeCompanyId, marketNavItems, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      setTimeout(() => {
        if (subMenuRefs.current[key]) {
          setSubMenuHeight((prev) => ({
            ...prev,
            [key]: subMenuRefs.current[key]?.scrollHeight || 0,
          }));
        }
      }, 50);
    }
  }, [openSubmenu, companies]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others" | "mercado") => {
    setOpenSubmenu((prev) => 
      prev?.type === menuType && prev?.index === index ? null : { type: menuType, index }
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others" | "mercado") => (
    <ul className="flex flex-col gap-2">
      {items.map((nav, index) => {
        const isMenuOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
        const hasActiveChild = nav.subItems?.some(sub => isActive(sub.path));

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group w-full ${
                  isMenuOpen || hasActiveChild ? "menu-item-active" : "menu-item-inactive"
                } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <span className={`menu-item-icon-size ${isMenuOpen || hasActiveChild ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="menu-item-text">{nav.name}</span>
                    <ChevronDownIcon className={`ml-auto w-4 h-4 transition-transform duration-300 ${isMenuOpen ? "rotate-180" : ""}`} />
                  </>
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
                >
                  <span className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}
            
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => (subMenuRefs.current[`${menuType}-${index}`] = el)}
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ height: isMenuOpen ? `${subMenuHeight[`${menuType}-${index}`] || "auto"}px` : "0px" }}
              >
                <ul className="mt-2 space-y-1 ml-9 border-l border-gray-200 dark:border-gray-800 pl-2">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      {subItem.path === "#" ? (
                        <span className="block px-3 py-2 text-xs text-gray-400 italic">
                          {subItem.name}
                        </span>
                      ) : (
                        <Link
                          to={subItem.path}
                          title={subItem.tooltip}
                          className={`menu-dropdown-item text-sm py-1.5 transition-colors ${
                            isActive(subItem.path) ? "menu-dropdown-item-active font-medium" : "menu-dropdown-item-inactive hover:text-brand-500"
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-white dark:bg-gray-900 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 dark:border-gray-800
        ${isExpanded || isMobileOpen || isHovered ? "w-[290px] px-5" : "w-[90px] px-4"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <img src="/images/logo/logo.svg" alt="Logo" width={150} height={40} className="dark:invert" />
          ) : (
            <img src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto no-scrollbar pb-10">
        <nav className="space-y-6">
          {/* Mercado Bursátil Section */}
          <div>
            <h2 className={`mb-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"} flex`}>
              {isExpanded || isHovered || isMobileOpen ? "Mercado Bursátil (BBV)" : <HorizontaLDots className="w-5 h-5" />}
            </h2>
            {renderMenuItems(marketNavItems, "mercado")}
          </div>

          {/* General Section */}
          <div>
            <h2 className={`mb-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"} flex`}>
              {isExpanded || isHovered || isMobileOpen ? "Administración" : <HorizontaLDots className="w-5 h-5" />}
            </h2>
            {renderMenuItems(STATIC_NAV, "main")}
          </div>

          {/* Components Section */}
          <div>
            <h2 className={`mb-4 text-[10px] font-semibold uppercase tracking-wider text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"} flex`}>
              {isExpanded || isHovered || isMobileOpen ? "Recursos" : <HorizontaLDots className="w-5 h-5" />}
            </h2>
            {renderMenuItems(OTHERS_NAV, "others")}
          </div>
        </nav>
        
        {(isExpanded || isHovered || isMobileOpen) && <div className="mt-auto pt-10"><SidebarWidget /></div>}
      </div>
    </aside>
  );
};

export default AppSidebar;

