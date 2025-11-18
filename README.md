# eta4.org Website

A modern, responsive website for **English Through Academics, Athletics and Arts Abroad** - a nonprofit organization that has been teaching English in Vietnam since 2009 through free 5-week summer camps.

## About eta4

From 2009 to 2019, eta4 taught over 14,250 students across Vietnam and Taiwan. After a pause due to COVID-19, the organization is planning to restart programs in Hue, Vietnam for Summer 2026.

## Features

### Design
- **Mobile-first responsive design** that looks great on all devices
- **Clean, vibrant color scheme** with solid colors (no gradients)
- **Smooth animations** and scroll effects for engaging user experience
- **Photo-driven design** using stock images for visual impact
- **Accessible** with keyboard navigation and screen reader support

### Sections

1. **Hero Section**
   - Full-width hero image with darkened overlay
   - Key statistics: 14,250 students taught, 700+ volunteers, 10 years active, 5-week programs
   - Clear calls-to-action for 2026 volunteer recruitment

2. **About/Mission Section**
   - Organization overview with accurate history
   - Sustainability callout highlighting local volunteer focus and "teach to fish" mentality
   - Three pillars with photo backgrounds: Academics, Athletics, Arts
   - Information about COVID pause and 2026 restart plans

3. **Programs Section**
   - 5-week program breakdown with images
   - Week-by-week overview cards

4. **Program History Timeline**
   - Complete timeline from 2009-2019
   - Detailed year-by-year breakdown showing:
     - All locations: Hue, Da Lat, Bien Hoa, Duc Linh in Phan Thiet Province (Vietnam), Taitung (Taiwan)
     - Student counts for each year
     - Peak year highlighted (2015: 2,500 students)
   - COVID pause notation (2020-2025)
   - Future plan for 2026 restart

5. **Interactive Map**
   - Built with Leaflet.js
   - Shows all historical program locations
   - Five locations with accurate coordinates:
     - Hue (primary location, restart in 2026)
     - Da Lat, Bien Hoa, Duc Linh in Phan Thiet Province (Vietnam)
     - Taitung (Taiwan)
   - Animated markers with popup information

6. **Stories Section**
   - Grid layout showcasing impact stories
   - Featured story with larger display
   - Uses stock photos from Unsplash

7. **Volunteer Section**
   - Focus on Summer 2026 recruitment for both international and local volunteers
   - Four key benefits including local/international collaboration
   - Emphasis on working with Vietnamese volunteers and building sustainable impact
   - Interest form with validation
   - Dark background for visual contrast

8. **Donation Section**
   - Support for 2026 restart messaging
   - Pre-set donation amounts
   - Custom amount option
   - Impact breakdown ($50, $250, $1000)
   - Ready for payment processor integration

9. **Footer**
   - Quick links
   - Contact information
   - Newsletter signup
   - Social media links

## Technical Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox, solid colors only
- **Vanilla JavaScript** - No framework dependencies
- **Leaflet.js** - Interactive mapping
- **Google Fonts** - Inter and Poppins typefaces

## Design Principles

- **No gradients** - All colors are solid for a clean, modern look
- **No emojis** - Professional design using photography instead
- **Photo-driven** - Stock images used for visual impact throughout
- **Mobile-first** - Optimized for mobile devices first, scales up beautifully

## File Structure

```
eta4/
├── index.html          # Main HTML file
├── styles.css          # All styling (mobile-first, no gradients)
├── script.js           # Interactive functionality
└── README.md          # This file
```

## Setup & Installation

1. **Local Development**
   Simply open `index.html` in a web browser. No build process required!

2. **Web Hosting**
   Upload all files to your web hosting provider:
   - index.html
   - styles.css
   - script.js

## Real Data Included

### Program History (2009-2019)
- **2009**: Hue, Vietnam - 350 students
- **2010**: Hue, Bien Hoa, Vietnam; Taitung, Taiwan - 1,100 students
- **2011**: Hue, Da Lat, Vietnam; Taitung, Taiwan - 1,300 students
- **2012**: Hue, Vietnam - 1,100 students
- **2013**: Hue, Duc Linh (Phan Thiet Province), Vietnam - 2,000 students
- **2014**: Hue, Duc Linh (Phan Thiet Province), Vietnam - 2,300 students
- **2015**: Hue, Duc Linh (Phan Thiet Province), Vietnam - 2,500 students (peak year)
- **2016-2018**: Hue, Vietnam - 1,000 students annually
- **2019**: Hue, Vietnam - 600 students
- **2020-2025**: COVID pause
- **2026**: Planned restart in Hue, Vietnam

**Total Impact**:
- 14,250 students across 10 active years
- 700+ international and local volunteers (averaging 30-50 per camp)

## Next Steps

### Content Updates

Replace placeholder content with real information:

1. **Update story cards** in the Stories section:
   - Replace stock photos with actual photos from your programs
   - Add real student and volunteer testimonials
   - Update names and stories to reflect real people

2. **Add real images**:
   - Hero image: Replace with photo from your programs
   - Pillar images: Use photos from actual academic, athletic, and arts activities
   - Program cards: Add photos from different program weeks
   - Story cards: Use real photos from participants

3. **Social media links**:
   - Add your Facebook, Instagram, Twitter URLs in the footer
   - Update with actual social media handles

4. **Update email address** if different from info@eta4.org

### Backend Integration

To make the site fully functional:

1. **Volunteer Form** (index.html:364-392)
   - Connect to email service (FormSpree, EmailJS, or similar)
   - Update form action in `script.js` (line 101)
   - Consider integrating with a CRM

2. **Donation Processing** (index.html:424-432)
   - Integrate payment processor (Stripe, PayPal, etc.)
   - Update `donateBtn` click handler in `script.js` (line 135)
   - Ensure 501(c)(3) tax receipt automation

3. **Newsletter Signup** (index.html:478-480)
   - Connect to email marketing service (Mailchimp, SendGrid, etc.)
   - Update in `script.js` (line 154)

### Customization

#### Colors
All colors use solid values in `styles.css` (lines 10-25):
```css
--primary: #FF6B6B;        /* Main brand color */
--secondary: #4ECDC4;      /* Secondary brand color */
--accent: #FFE66D;         /* Accent color */
--success: #48BB78;        /* Donation/success color */
```

#### Photos
Replace Unsplash URLs with your own images:
- Hero: index.html:41
- Pillars: index.html:101, 106, 111
- Programs: index.html:129, 137, 145
- Stories: index.html:283, 292, 301, 310
- Benefits: index.html:336, 345, 354

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Lightweight (~120KB total without images)
- Fast loading times
- Optimized for mobile
- Lazy loading ready for images
- Minimal external dependencies (only Leaflet.js)

## Accessibility

- Semantic HTML
- ARIA labels where appropriate
- Keyboard navigation support
- Reduced motion support
- High contrast ratios for readability
- Form labels and validation

## Future Enhancements

Consider adding:
- Blog section for program updates
- Photo gallery from historical camps
- Detailed volunteer testimonials page
- Annual reports and transparency section
- Alumni network feature
- Multi-language support (Vietnamese translation)
- CMS integration for easier content updates
- Video testimonials
- Live donation goal tracker

## Support

For questions or assistance with the website:
- Email: info@eta4.org
- Website: eta4.org

---

**Built to showcase 15 years of making a difference in Vietnam**

Designed for the 2026 restart and beyond.
