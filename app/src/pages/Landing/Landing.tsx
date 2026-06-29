import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AutoStoriesRounded,
  DarkMode,
  FavoriteRounded,
  LightMode,
  LocalFloristRounded,
  LockRounded,
  MenuRounded,
  PlayCircleOutlineRounded,
  SchoolRounded,
  SecurityRounded,
  SpaRounded,
  SupportAgentRounded,
  VerifiedUserRounded,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Typography,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { useThemeMode } from "../../contexts/ThemeContext";
import { API_CONFIG } from "../../config";
import { useMe } from "../../hooks/useMe";
import { usePageSeoOverride } from "../../hooks/usePageSeoOverride";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { useTranslation } from "../../hooks/useTranslation";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import {
  buildDefaultStructuredData,
  buildStructuredDataLogoUrl,
} from "../../seo/build-structured-data";
import { resolveAppBaseUrl } from "../../seo/build-page-seo";
import { buildSeoDescription, resolveAbsoluteUrl } from "../../seo/seo-text.util";
import AppTooltip from "../../shared/AppTooltip";
import { AvatarInitial } from "../../shared/display/AvatarInitial";
import EnamadTrustSeal from "../../shared/EnamadTrustSeal";
import {
  resolveAvatarInitial,
  resolveMeUserDisplayName,
  resolveStoredUserDisplayName,
} from "../../utils/storedUser.util";
import ProductCard from "../Products/ProductCard";
import { useLandingFeaturedProducts } from "./useLandingFeaturedProducts";
import styles from "./styles/landing.module.scss";

const FEATURED_PRODUCT_COUNT = 3;

type RevealSectionProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly delay?: number;
  readonly id?: string;
};

const RevealSection = ({
  children,
  className,
  delay = 0,
  id,
}: RevealSectionProps): ReactElement => {
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  return (
    <Box
      ref={ref}
      id={id}
      component="section"
      className={[styles.reveal, isVisible ? styles.revealVisible : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Box>
  );
};

type SectionHeaderProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly centered?: boolean;
};

const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
  centered = true,
}: SectionHeaderProps): ReactElement => (
  <Box className={[styles.sectionHeader, centered ? styles.sectionHeaderCentered : ""].join(" ")}>
    <Typography component="p" className={styles.sectionEyebrow}>
      {eyebrow}
    </Typography>
    <Typography variant="h3" component="h2" className={styles.sectionTitle}>
      {title}
    </Typography>
    <Typography variant="body1" className={styles.sectionSubtitle}>
      {subtitle}
    </Typography>
  </Box>
);

const Landing = (): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser } = useAuth();
  const { user: meUser, avatarUrl, loading: userLoading } = useMe();
  const { mode, toggleTheme } = useThemeMode();
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { products: featuredProducts, loading: productsLoading } = useLandingFeaturedProducts();

  const { displayName, avatarLetter } = useMemo(() => {
    const name =
      userLoading || !meUser
        ? resolveStoredUserDisplayName(authUser, authUser?.username ?? "")
        : resolveMeUserDisplayName(meUser, authUser?.username ?? "");
    return { displayName: name, avatarLetter: resolveAvatarInitial(name) };
  }, [authUser, meUser, userLoading]);

  const pageSeoOverride = useMemo(() => {
    const appUrl = resolveAppBaseUrl(API_CONFIG.APP_URL);
    const canonicalPath = APP_SHELL_ROUTES.landing;
    const canonicalUrl = resolveAbsoluteUrl(appUrl, canonicalPath);
    const siteName = t("seo.brand.name");
    const description = buildSeoDescription(t("seo.pages.landing.description"));
    const logoUrl = buildStructuredDataLogoUrl(appUrl, "/icons/icon-512.png");

    return {
      title: t("pages.landing.pageTitle"),
      description,
      canonicalPath,
      robots: t("seo.pages.landing.robots"),
      keywords: t("seo.pages.landing.keywords"),
      jsonLd: buildDefaultStructuredData({
        t,
        appUrl,
        canonicalUrl,
        siteName,
        description,
        logoUrl,
      }),
    };
  }, [t]);

  usePageSeoOverride(pageSeoOverride);

  useEffect(() => {
    const handleScroll = (): void => {
      setNavScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = useCallback((sectionId: string): void => {
    setMobileNavOpen(false);
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleProductOpen = useCallback(
    (productId: string): void => {
      navigate(`${APP_SHELL_ROUTES.products}/${productId}`);
    },
    [navigate]
  );

  const handleProductKeyDown = useCallback(
    (productId: string, event: KeyboardEvent<HTMLElement>): void => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleProductOpen(productId);
      }
    },
    [handleProductOpen]
  );

  const primaryCtaLabel = isAuthenticated
    ? t("pages.landing.nav.myProducts")
    : t("pages.landing.hero.ctaPrimary");

  const navLinks = [
    { id: "features", label: t("pages.landing.nav.features") },
    { id: "products", label: t("pages.landing.nav.products") },
    { id: "steps", label: t("pages.landing.nav.howItWorks") },
    { id: "support", label: t("pages.landing.nav.support"), href: APP_SHELL_ROUTES.support },
  ] as const;

  const featureItems = [
    {
      key: "products",
      icon: <SchoolRounded />,
      title: t("pages.landing.features.items.products.title"),
      description: t("pages.landing.features.items.products.description"),
    },
    {
      key: "path",
      icon: <AutoStoriesRounded />,
      title: t("pages.landing.features.items.path.title"),
      description: t("pages.landing.features.items.path.description"),
    },
    {
      key: "support",
      icon: <SupportAgentRounded />,
      title: t("pages.landing.features.items.support.title"),
      description: t("pages.landing.features.items.support.description"),
    },
    {
      key: "payment",
      icon: <LockRounded />,
      title: t("pages.landing.features.items.payment.title"),
      description: t("pages.landing.features.items.payment.description"),
    },
  ] as const;

  const stepItems = [
    {
      key: "signup",
      number: "۰۱",
      icon: <FavoriteRounded />,
      title: t("pages.landing.steps.items.signup.title"),
      description: t("pages.landing.steps.items.signup.description"),
    },
    {
      key: "browse",
      number: "۰۲",
      icon: <LocalFloristRounded />,
      title: t("pages.landing.steps.items.browse.title"),
      description: t("pages.landing.steps.items.browse.description"),
    },
    {
      key: "learn",
      number: "۰۳",
      icon: <SpaRounded />,
      title: t("pages.landing.steps.items.learn.title"),
      description: t("pages.landing.steps.items.learn.description"),
    },
  ] as const;

  const trustItems = [
    {
      key: "privacy",
      icon: <SecurityRounded />,
      title: t("pages.landing.trust.items.privacy.title"),
      description: t("pages.landing.trust.items.privacy.description"),
    },
    {
      key: "secure",
      icon: <VerifiedUserRounded />,
      title: t("pages.landing.trust.items.secure.title"),
      description: t("pages.landing.trust.items.secure.description"),
    },
    {
      key: "verified",
      icon: <PlayCircleOutlineRounded />,
      title: t("pages.landing.trust.items.verified.title"),
      description: t("pages.landing.trust.items.verified.description"),
    },
  ] as const;

  return (
    <Box className={styles.page} aria-label={t("pages.landing.pageTitle")}>
      <Box className={styles.ambientGlow} aria-hidden />
      <Box className={styles.orbOne} aria-hidden />
      <Box className={styles.orbTwo} aria-hidden />
      <Box className={styles.orbThree} aria-hidden />
      <Box className={styles.sparkleField} aria-hidden>
        {Array.from({ length: 12 }, (_, index) => (
          <span
            key={`sparkle-${index}`}
            className={styles.sparkle}
            style={{ "--i": index } as React.CSSProperties}
          />
        ))}
      </Box>
      <Box className={styles.petalField} aria-hidden>
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={`petal-${index}`}
            className={styles.petal}
            style={{ "--i": index } as React.CSSProperties}
          />
        ))}
      </Box>

      <Box
        component="header"
        className={[styles.header, navScrolled ? styles.headerScrolled : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <Box className={styles.headerInner}>
          <Link to={APP_SHELL_ROUTES.landing} className={styles.brandLink}>
            <Box
              component="img"
              src="/logo.png"
              alt={t("layout.header.brand.title")}
              className={styles.brandLogo}
            />
            <Box className={styles.brandText}>
              <Typography component="span" className={styles.brandName}>
                {t("layout.header.brand.title")}
              </Typography>
              <Typography component="span" className={styles.brandTagline}>
                {t("layout.header.brand.publicTagline")}
              </Typography>
            </Box>
          </Link>

          <Box
            component="nav"
            className={styles.desktopNav}
            aria-label={t("pages.landing.pageTitle")}
          >
            {navLinks.map((link) =>
              "href" in link && link.href ? (
                <Link key={link.id} to={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.id}
                  type="button"
                  className={styles.navLink}
                  onClick={() => scrollToSection(link.id)}
                >
                  {link.label}
                </button>
              )
            )}
          </Box>

          <Box className={styles.headerActions}>
            <AppTooltip
              title={
                mode === "light"
                  ? t("auth.login.theme.enableDarkMode")
                  : t("auth.login.theme.enableLightMode")
              }
            >
              <IconButton
                onClick={toggleTheme}
                className={styles.iconButton}
                aria-label={t("auth.login.theme.toggleTheme")}
              >
                {mode === "light" ? <DarkMode /> : <LightMode />}
              </IconButton>
            </AppTooltip>

            {isAuthenticated ? (
              <AppTooltip title={t("app.pageTitles.profile")}>
                <Link
                  to={APP_SHELL_ROUTES.profile}
                  className={styles.userProfileChip}
                  aria-label={t("app.pageTitles.profile")}
                >
                  <Avatar
                    className={styles.userProfileAvatar}
                    src={avatarUrl ?? undefined}
                    alt={displayName}
                  >
                    <AvatarInitial initial={avatarLetter} />
                  </Avatar>
                  <span className={styles.userProfileName}>{displayName}</span>
                </Link>
              </AppTooltip>
            ) : null}

            {!isAuthenticated ? (
              <>
                <Button
                  component={Link}
                  to={APP_SHELL_ROUTES.profileLogin}
                  className={styles.navGhostButton}
                >
                  {t("pages.landing.nav.login")}
                </Button>
                <Button
                  component={Link}
                  to={APP_SHELL_ROUTES.profileSignup}
                  variant="contained"
                  className={styles.navPrimaryButton}
                >
                  {t("pages.landing.nav.signup")}
                </Button>
              </>
            ) : (
              <Button
                component={Link}
                to={APP_SHELL_ROUTES.products}
                variant="contained"
                className={styles.navPrimaryButton}
              >
                {t("pages.landing.nav.viewProducts")}
              </Button>
            )}

            <IconButton
              className={[styles.iconButton, styles.mobileMenuButton].join(" ")}
              aria-label={t("pages.landing.nav.features")}
              onClick={() => setMobileNavOpen(true)}
            >
              <MenuRounded />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Drawer
        anchor="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        PaperProps={{ className: styles.mobileDrawer }}
      >
        <List className={styles.mobileNavList}>
          {navLinks.map((link) =>
            "href" in link && link.href ? (
              <ListItemButton
                key={link.id}
                component={Link}
                to={link.href}
                onClick={() => setMobileNavOpen(false)}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            ) : (
              <ListItemButton key={link.id} onClick={() => scrollToSection(link.id)}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            )
          )}
          {!isAuthenticated ? (
            <>
              <ListItemButton
                component={Link}
                to={APP_SHELL_ROUTES.profileLogin}
                onClick={() => setMobileNavOpen(false)}
              >
                <ListItemText primary={t("pages.landing.nav.login")} />
              </ListItemButton>
              <ListItemButton
                component={Link}
                to={APP_SHELL_ROUTES.profileSignup}
                onClick={() => setMobileNavOpen(false)}
              >
                <ListItemText primary={t("pages.landing.nav.signup")} />
              </ListItemButton>
            </>
          ) : (
            <ListItemButton
              component={Link}
              to={APP_SHELL_ROUTES.profile}
              onClick={() => setMobileNavOpen(false)}
            >
              <ListItemText primary={displayName} secondary={t("app.pageTitles.profile")} />
            </ListItemButton>
          )}
        </List>
      </Drawer>

      <Box component="main" className={styles.main}>
        <Box component="section" className={styles.hero} aria-labelledby="landing-hero-title">
          <Box className={styles.heroContent}>
            <Typography component="p" className={[styles.heroEyebrow, styles.fadeInUp].join(" ")}>
              {t("pages.landing.hero.eyebrow")}
            </Typography>

            <Typography
              id="landing-hero-title"
              variant="h2"
              component="h1"
              className={[styles.heroTitle, styles.fadeInUp, styles.fadeInUpDelay1].join(" ")}
            >
              {t("pages.landing.hero.title")}
            </Typography>

            <Typography
              variant="body1"
              className={[styles.heroSubtitle, styles.fadeInUp, styles.fadeInUpDelay2].join(" ")}
            >
              {t("pages.landing.hero.subtitle")}
            </Typography>

            <Box className={[styles.heroCtas, styles.fadeInUp, styles.fadeInUpDelay3].join(" ")}>
              <Button
                component={Link}
                to={APP_SHELL_ROUTES.products}
                variant="contained"
                size="large"
                className={styles.heroPrimaryButton}
              >
                {primaryCtaLabel}
              </Button>
              {!isAuthenticated ? (
                <Button
                  component={Link}
                  to={APP_SHELL_ROUTES.profileSignup}
                  variant="outlined"
                  size="large"
                  className={styles.heroSecondaryButton}
                >
                  {t("pages.landing.hero.ctaSecondary")}
                </Button>
              ) : null}
            </Box>

            <Box className={[styles.heroStats, styles.fadeInUp, styles.fadeInUpDelay4].join(" ")}>
              {[
                t("pages.landing.hero.stats.multimedia"),
                t("pages.landing.hero.stats.personalized"),
                t("pages.landing.hero.stats.support"),
              ].map((label) => (
                <Box key={label} className={styles.heroStat}>
                  <span className={styles.heroStatDot} aria-hidden />
                  <Typography component="span">{label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box className={styles.heroVisual} aria-hidden>
            <Box className={styles.heroCard}>
              <Box className={styles.heroCardGlow} />
              <Box component="img" src="/logo.png" alt="" className={styles.heroCardLogo} />
              <Typography className={styles.heroCardBadge}>
                {t("pages.landing.hero.badge")}
              </Typography>
              <Box className={styles.heroCardRings}>
                <span className={styles.heroRing} />
                <span className={styles.heroRing} />
                <span className={styles.heroRing} />
              </Box>
            </Box>
          </Box>
        </Box>

        <RevealSection id="features" className={styles.featuresSection}>
          <SectionHeader
            eyebrow={t("pages.landing.features.eyebrow")}
            title={t("pages.landing.features.title")}
            subtitle={t("pages.landing.features.subtitle")}
          />
          <Box className={styles.featureGrid}>
            {featureItems.map((item, index) => (
              <Box
                key={item.key}
                className={styles.featureCard}
                style={{ "--card-index": index } as React.CSSProperties}
              >
                <Box className={styles.featureIcon}>{item.icon}</Box>
                <Typography variant="h6" component="h3" className={styles.featureTitle}>
                  {item.title}
                </Typography>
                <Typography variant="body2" className={styles.featureDescription}>
                  {item.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </RevealSection>

        <RevealSection id="steps" className={styles.stepsSection} delay={80}>
          <SectionHeader
            eyebrow={t("pages.landing.steps.eyebrow")}
            title={t("pages.landing.steps.title")}
            subtitle={t("pages.landing.steps.subtitle")}
          />
          <Box className={styles.stepsTrack}>
            {stepItems.map((step, index) => (
              <Box
                key={step.key}
                className={styles.stepCard}
                style={{ "--card-index": index } as React.CSSProperties}
              >
                <Typography className={styles.stepNumber}>{step.number}</Typography>
                <Box className={styles.stepIcon}>{step.icon}</Box>
                <Typography variant="h6" component="h3" className={styles.stepTitle}>
                  {step.title}
                </Typography>
                <Typography variant="body2" className={styles.stepDescription}>
                  {step.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </RevealSection>

        <RevealSection id="products" className={styles.productsSection} delay={120}>
          <SectionHeader
            eyebrow={t("pages.landing.products.eyebrow")}
            title={t("pages.landing.products.title")}
            subtitle={t("pages.landing.products.subtitle")}
          />
          <Box className={styles.productGrid}>
            {productsLoading
              ? Array.from({ length: FEATURED_PRODUCT_COUNT }, (_, index) => (
                  <Skeleton
                    key={`product-skeleton-${index}`}
                    variant="rounded"
                    className={styles.productSkeleton}
                  />
                ))
              : null}
            {!productsLoading && featuredProducts.length === 0 ? (
              <Typography className={styles.productsEmpty}>
                {t("pages.landing.products.empty")}
              </Typography>
            ) : null}
            {!productsLoading
              ? featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    item={product}
                    variant="public"
                    coverImageAccessUrl={product.coverImageAccessUrl}
                    onOpen={() => handleProductOpen(product.id)}
                    onKeyDown={(event) => handleProductKeyDown(product.id, event)}
                  />
                ))
              : null}
          </Box>
          <Box className={styles.productsCta}>
            <Button
              component={Link}
              to={APP_SHELL_ROUTES.products}
              variant="outlined"
              size="large"
              className={styles.viewAllButton}
            >
              {t("pages.landing.products.viewAll")}
            </Button>
          </Box>
        </RevealSection>

        <RevealSection id="trust" className={styles.trustSection} delay={160}>
          <SectionHeader
            eyebrow={t("pages.landing.trust.eyebrow")}
            title={t("pages.landing.trust.title")}
            subtitle={t("pages.landing.trust.subtitle")}
          />
          <Box className={styles.trustGrid}>
            {trustItems.map((item, index) => (
              <Box
                key={item.key}
                className={styles.trustCard}
                style={{ "--card-index": index } as React.CSSProperties}
              >
                <Box className={styles.trustIcon}>{item.icon}</Box>
                <Typography variant="h6" component="h3">
                  {item.title}
                </Typography>
                <Typography variant="body2">{item.description}</Typography>
              </Box>
            ))}
          </Box>
          <Box className={styles.enamadWrap}>
            <EnamadTrustSeal />
          </Box>
        </RevealSection>

        <RevealSection className={styles.ctaSection} delay={200}>
          <Box className={styles.ctaCard}>
            <Box className={styles.ctaGlow} aria-hidden />
            <Typography variant="h4" component="h2" className={styles.ctaTitle}>
              {t("pages.landing.cta.title")}
            </Typography>
            <Typography variant="body1" className={styles.ctaSubtitle}>
              {t("pages.landing.cta.subtitle")}
            </Typography>
            <Box className={styles.ctaButtons}>
              <Button
                component={Link}
                to={APP_SHELL_ROUTES.products}
                variant="contained"
                size="large"
                className={styles.ctaPrimaryButton}
              >
                {t("pages.landing.cta.primary")}
              </Button>
              {!isAuthenticated ? (
                <Button
                  component={Link}
                  to={APP_SHELL_ROUTES.profileSignup}
                  variant="outlined"
                  size="large"
                  className={styles.ctaSecondaryButton}
                >
                  {t("pages.landing.cta.secondary")}
                </Button>
              ) : null}
            </Box>
          </Box>
        </RevealSection>
      </Box>

      <Box component="footer" className={styles.footer}>
        <Box className={styles.footerInner}>
          <Box className={styles.footerBrand}>
            <Box component="img" src="/logo.png" alt="" className={styles.footerLogo} />
            <Typography className={styles.footerBrandName}>
              {t("layout.header.brand.title")}
            </Typography>
            <Typography className={styles.footerTagline}>
              {t("pages.landing.footer.tagline")}
            </Typography>
          </Box>
          <Box
            component="nav"
            className={styles.footerLinks}
            aria-label={t("layout.footer.ariaLabel")}
          >
            <Link to={APP_SHELL_ROUTES.products} className={styles.footerLink}>
              {t("pages.landing.footer.links.products")}
            </Link>
            <Link to={APP_SHELL_ROUTES.support} className={styles.footerLink}>
              {t("pages.landing.footer.links.support")}
            </Link>
            <Link to={APP_SHELL_ROUTES.moreAbout} className={styles.footerLink}>
              {t("pages.landing.footer.links.about")}
            </Link>
            <Link to={APP_SHELL_ROUTES.morePrivacyPolicy} className={styles.footerLink}>
              {t("pages.landing.footer.links.privacy")}
            </Link>
            <Link to={APP_SHELL_ROUTES.moreTermsOfUse} className={styles.footerLink}>
              {t("pages.landing.footer.links.terms")}
            </Link>
          </Box>
          <Typography className={styles.footerCopyright}>{t("layout.footer.copyright")}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Landing;
