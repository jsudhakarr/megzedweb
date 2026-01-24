import { Link } from 'react-router-dom';
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  MessageCircle,
} from 'lucide-react';
import type { AppSettings } from '../services/appSettings';

interface FooterProps {
  settings?: AppSettings | null;
  primaryColor: string;
}

export default function Footer({ settings, primaryColor }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const appName = settings?.appname || settings?.sitename || 'Megzed';
  const contactEmail = settings?.contact_email || 'support@megzed.com';
  const contactPhone =
    settings?.contact_phone || settings?.contact_number || '+1 (234) 567-890';
  const languageCode =
    (settings?.language || settings?.default_language || 'EN').toUpperCase();
  const currencyCode = settings?.currency || 'USD';
  const footerText = settings?.footer_text
    ? `${currentYear} ${settings.footer_text}`
    : `${currentYear} ${appName}. All rights reserved.`;
  const appDownloadLinks = [
    {
      href: settings?.play_store_link || settings?.android_store_url,
      title: 'Google Play',
    },
    {
      href: settings?.app_store_link || settings?.ios_store_url,
      title: 'App Store',
    },
  ].filter((link) => Boolean(link.href));
  const socialLinks = [
    { href: settings?.facebook_url, label: 'Facebook', icon: Facebook },
    { href: settings?.x_url, label: 'X', icon: Twitter },
    { href: settings?.instagram_url, label: 'Instagram', icon: Instagram },
    { href: settings?.youtube_url, label: 'YouTube', icon: Youtube },
    { href: settings?.whatsapp_url, label: 'WhatsApp', icon: MessageCircle },
  ].filter((link) => Boolean(link.href));

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {settings?.logo?.thumbnail ? (
                <img
                  src={settings.logo.thumbnail}
                  alt={appName}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <Store className="w-6 h-6" style={{ color: primaryColor }} />
              )}
              <span className="text-lg font-bold text-white">
                {appName.split(' - ')[0]}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              {settings?.description ||
                'Your trusted marketplace for buying and selling. Find great deals and list your items today.'}
            </p>
            <div className="flex gap-3">
              {socialLinks.length > 0 ? (
                socialLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                      aria-label={link.label}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })
              ) : (
                <span className="text-xs text-slate-500">No social links</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/pages/about" className="text-sm hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/pages/contact" className="text-sm hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/pages/terms" className="text-sm hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/pages/privacy" className="text-sm hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/pages/refund" className="text-sm hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/pages/safety" className="text-sm hover:text-white transition-colors">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link to="/pages/faq" className="text-sm hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-sm hover:text-white transition-colors break-all"
                >
                  {contactEmail}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                <a
                  href={`tel:${contactPhone}`}
                  className="text-sm hover:text-white transition-colors"
                >
                  {contactPhone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                <span className="text-sm">
                  {settings?.contact_address || 'Contact address available on request.'}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                <span className="text-sm">
                  {currencyCode} | {languageCode}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {appDownloadLinks.length > 0 && (
          <div className="mt-10 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-800/90 via-slate-800/60 to-slate-800/90 px-6 py-8 lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  Experience the magic
                </p>
                <h3 className="text-2xl font-semibold text-white">
                  Download the {appName.split(' - ')[0]} app
                </h3>
                <p className="text-sm text-slate-300">
                  Get the full experience with faster browsing, instant alerts, and secure payments.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {appDownloadLinks.map((link) => (
                  <a
                    key={link.title}
                    href={link.href}
                    className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="text-left">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Download on the
                      </p>
                      <p className="text-sm font-semibold text-slate-900">{link.title}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <p className="text-sm text-slate-400">{footerText}</p>
        </div>
      </div>
    </footer>
  );
}
