# Security Improvements for HallPass Pro

## Overview
This document outlines the security enhancements made to protect against XSS (Cross-Site Scripting) and SQL Injection vulnerabilities, as well as other security improvements.

---

## 1. XSS (Cross-Site Scripting) Protection

### What is XSS?
XSS occurs when malicious scripts are injected into web applications through user input and executed in the browser.

### Vulnerabilities Fixed

#### Frontend - HTML Escaping
**Files Updated:**
- [app/admin/page.tsx](app/admin/page.tsx)
- [app/student/page.tsx](app/student/page.tsx)
- [app/teacher/page.tsx](app/teacher/page.tsx)
- [app/login/page.tsx](app/login/page.tsx)

**What Was Fixed:**
- User names were displayed without escaping (vulnerability: `<img src=x onerror="alert('XSS')">` in name)
- Room numbers and destinations were displayed without escaping
- Notes/reasons were displayed without HTML encoding
- Error messages were rendered as-is without sanitization

**Solution Implemented:**
```typescript
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}
```

All user-provided data is now escaped before rendering:
- `{escapeHtml(pass.student.name)}`
- `{escapeHtml(pass.fromRoom)}`
- `{escapeHtml(pass.notes)}`
- `{escapeHtml(error)}`

#### Frontend - Safe Status Display
Status values are now validated against a whitelist instead of rendering arbitrary strings:
```typescript
const statusMap: { [key: string]: JSX.Element } = {
  'pending': <span className="badge badge-pending">⏳ Pending</span>,
  'approved': <span className="badge badge-approved">✓ Approved</span>,
  'denied': <span className="badge badge-denied">✗ Denied</span>,
  'returned': <span className="badge badge-returned">↩ Returned</span>,
}
```

---

## 2. SQL Injection Protection

### What is SQL Injection?
SQL Injection occurs when attackers inject malicious SQL code through input fields to manipulate database queries.

### Protection Status
✅ **Already Protected** - Prisma ORM handles SQL Injection prevention automatically through parameterized queries.

All database queries use Prisma's query builder, which:
- Never concatenates user input into SQL strings
- Uses prepared statements with parameter binding
- Validates and escapes all values at the database driver level

Example of secure queries:
```typescript
// ✅ Safe - Prisma handles parameter binding
await prisma.pass.findUnique({ where: { id: params.id } })
await prisma.pass.create({ data: { fromRoom, to, notes } })
```

---

## 3. Input Validation & Sanitization

### New File: [lib/sanitize.ts](lib/sanitize.ts)

Utility functions to validate and sanitize user input:

#### `sanitizeInput(input, maxLength)`
- Trims whitespace
- Enforces maximum length
- Escapes HTML special characters
- Prevents both XSS and buffer overflow attacks

#### `sanitizeRoomCode(input)`
- Restricts to alphanumeric characters and hyphens only
- Limits to 10 characters
- Prevents injection through room identifiers

#### `validateInput(input, fieldName, minLength, maxLength)`
- Validates input type and length
- Returns validation errors
- Type-safe checks before database operations

### API Endpoint Updates

#### POST /api/passes - Create Pass
**New Validations:**
```typescript
- fromRoom: Required, 1-50 chars, alphanumeric only
- to: Required, 1-50 chars, alphanumeric only  
- notes: Optional, 0-300 chars, sanitized
```

**Before Storage:**
- All inputs sanitized
- Content length limits enforced
- Harmful characters removed

#### PUT /api/passes/[id]/approve
**New Validations:**
- ID format validated (alphanumeric, 25 chars max)
- Teacher can only approve passes from their own students
- Pass must be in "pending" status

#### PUT /api/passes/[id]/deny
**New Validations:**
- ID format validated
- Teacher can only deny passes from their own students
- Pass must be in "pending" status

#### PUT /api/passes/[id]/return
**New Validations:**
- ID format validated
- Students can only return their own passes
- Teachers can only return passes from their students
- Pass must be in "approved" status

---

## 4. Authorization & Authentication

### Enhanced Authorization Checks

#### Return Endpoint Authorization
```typescript
// Students can only return their own passes
if (session.user.role === 'student' && pass.studentId !== session.user.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}

// Teachers can only manage passes from their students
if (session.user.role === 'teacher') {
  const student = await prisma.user.findUnique({ where: { id: pass.studentId } })
  if (!student || student.teacherId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
}
```

### Session Management
- JWT-based sessions via NextAuth
- Credentials validated against bcrypt-hashed passwords
- Role-based access control (RBAC) enforced on all endpoints

---

## 5. Error Handling

### Secure Error Messages
- API errors don't leak sensitive system information
- Generic error messages shown to users
- Detailed errors logged server-side only

### Input Validation Errors
All validation errors provide user-friendly messages:
- "From Room must be at least 1 character"
- "Destination must not exceed 50 characters"
- Invalid JSON returns proper error response

---

## 6. Deployment Recommendations

### Environment Variables Required
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<strong-random-value>
NEXTAUTH_URL=https://yourdomain.com
```

### Security Headers (Recommended for Production)
Add to `next.config.js`:
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ]
}
```

### HTTPS Enforcement
- Always use HTTPS in production
- Set `NEXTAUTH_URL` to https:// variant
- Enable HSTS (HTTP Strict Transport Security)

---

## 7. Testing Security

### Manual Testing Checklist

- [ ] Try entering `<img src=x onerror="alert('xss')">` as room number
- [ ] Try entering JavaScript code in student name field
- [ ] Try entering SQL injection syntax in destination field
- [ ] Test with extremely long inputs (1000+ characters)
- [ ] Verify teacher can't access passes from other teachers' students
- [ ] Verify student can't return another student's passes

---

## 8. Additional Security Measures (Future)

### Recommended Enhancements
1. **Rate Limiting** - Prevent brute force attacks on login
2. **CSRF Tokens** - Additional layer beyond NextAuth defaults
3. **Content Security Policy (CSP)** - Prevent inline script execution
4. **Input Sanitization Library** - Use `dompurify` for rich text if needed
5. **Audit Logging** - Log all pass approvals/denials with timestamps
6. **2FA/MFA** - Multi-factor authentication for admin accounts
7. **Data Encryption** - Encrypt sensitive data at rest
8. **Regular Security Audits** - Penetration testing and code reviews

---

## 9. References

- [OWASP Top 10 - XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Top 10 - SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [NextAuth.js Security](https://next-auth.js.org/getting-started/example)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#sql-injection)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework/)

---

## Summary of Changes

| File | Changes | Security Impact |
|------|---------|-----------------|
| [lib/sanitize.ts](lib/sanitize.ts) | Created new sanitization utilities | High - Prevents XSS |
| [app/api/passes/route.ts](app/api/passes/route.ts) | Added input validation and sanitization | High - Validates user input |
| [app/api/passes/[id]/approve/route.ts](app/api/passes/[id]/approve/route.ts) | Added teacher authorization checks | High - Prevents unauthorized actions |
| [app/api/passes/[id]/deny/route.ts](app/api/passes/[id]/deny/route.ts) | Added teacher authorization checks | High - Prevents unauthorized actions |
| [app/api/passes/[id]/return/route.ts](app/api/passes/[id]/return/route.ts) | Added student/teacher authorization | High - Prevents unauthorized access |
| [app/admin/page.tsx](app/admin/page.tsx) | Added HTML escaping for all user data | High - Prevents XSS in admin panel |
| [app/student/page.tsx](app/student/page.tsx) | Added HTML escaping, error handling | High - Prevents XSS in student panel |
| [app/teacher/page.tsx](app/teacher/page.tsx) | Added HTML escaping for all user data | High - Prevents XSS in teacher panel |
| [app/login/page.tsx](app/login/page.tsx) | Added error message escaping | Medium - Prevents XSS on login |

---

**Last Updated:** May 21, 2026
**Security Level:** Production-Ready (with additional measures recommended above)
