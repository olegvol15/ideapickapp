'use client';

import { cn } from '@/lib/utils';

// Renders AI-generated text as a react-tweet-identical X post card.
// Dimensions, spacing, CSS variables, and element structure match
// react-tweet's twitter-theme output exactly.

interface XPostPreviewProps {
  text: string;
  className?: string;
}

function XBrandIcon() {
  return (
    <svg
      width="23.75"
      height="23.75"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ height: '1.25em', fill: 'currentColor', userSelect: 'none' }}
    >
      <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" />
    </svg>
  );
}

function LikeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{
        height: '1.25em',
        fill: 'currentColor',
        userSelect: 'none',
        color: 'var(--tweet-color-red-primary)',
      }}
    >
      <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.667-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{
        height: '1.25em',
        fill: 'currentColor',
        userSelect: 'none',
        color: 'var(--tweet-color-green-primary)',
      }}
    >
      <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" />
    </svg>
  );
}

export function XPostPreview({ text, className }: XPostPreviewProps) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={cn('react-tweet-theme', className)}
      style={{
        width: '100%',
        minWidth: '250px',
        overflow: 'hidden',
        color: 'var(--tweet-font-color)',
        fontFamily: 'var(--tweet-font-family)',
        fontWeight: 400,
        boxSizing: 'border-box',
        border: 'var(--tweet-border)',
        borderRadius: '12px',
        backgroundColor: 'var(--tweet-bg-color)',
        transition: 'background-color 0.2s',
      }}
    >
      <article
        style={{
          position: 'relative',
          boxSizing: 'inherit',
          padding: '0.75rem 1rem',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            paddingBottom: '0.75rem',
            lineHeight: 'var(--tweet-header-line-height)',
            fontSize: 'var(--tweet-header-font-size)',
            whiteSpace: 'nowrap',
            overflowWrap: 'break-word',
            overflow: 'hidden',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              position: 'relative',
              height: '48px',
              width: '48px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                height: '100%',
                width: '100%',
                position: 'absolute',
                overflow: 'hidden',
                borderRadius: '9999px',
                backgroundColor: 'var(--tweet-color-blue-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              IP
            </div>
          </div>

          {/* Author */}
          <div
            style={{
              maxWidth: 'calc(100% - 84px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              margin: '0 0.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                IdeaPick
              </span>
            </div>
            <div style={{ display: 'flex' }}>
              <span
                style={{
                  color: 'var(--tweet-font-color-secondary)',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                @ideapickapp
              </span>
              <span
                style={{
                  padding: '0 0.25rem',
                  color: 'var(--tweet-font-color-secondary)',
                }}
              >
                ·
              </span>
              <span
                style={{
                  color: 'var(--tweet-color-blue-secondary)',
                  fontWeight: 700,
                }}
              >
                Follow
              </span>
            </div>
          </div>

          {/* X brand icon */}
          <div
            style={{
              marginInlineStart: 'auto',
              color: 'var(--tweet-twitter-icon-color)',
            }}
          >
            <XBrandIcon />
          </div>
        </div>

        {/* Body */}
        <p
          style={{
            fontSize: 'var(--tweet-body-font-size)',
            fontWeight:
              'var(--tweet-body-font-weight)' as React.CSSProperties['fontWeight'],
            lineHeight: 'var(--tweet-body-line-height)',
            margin: 'var(--tweet-body-margin)',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            color: 'var(--tweet-font-color)',
          }}
        >
          {text}
        </p>

        {/* Info row (timestamp) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--tweet-font-color-secondary)',
            marginTop: '0.75rem',
            fontSize: 'var(--tweet-info-font-size)',
            lineHeight: 'var(--tweet-info-line-height)',
            overflowWrap: 'break-word',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          <span>
            {timeStr} · {dateStr} ·{' '}
            <strong
              style={{ color: 'var(--tweet-font-color)', fontWeight: 700 }}
            >
              X
            </strong>
          </span>
        </div>

        {/* Actions row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--tweet-font-color-secondary)',
            paddingTop: '0.25rem',
            marginTop: '0.25rem',
            borderTop: 'var(--tweet-border)',
            whiteSpace: 'nowrap',
          }}
        >
          {/* Reply */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginRight: '1.25rem',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: 'var(--tweet-actions-icon-wrapper-size)',
                height: 'var(--tweet-actions-icon-wrapper-size)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: '-0.25rem',
                borderRadius: '9999px',
                color: 'var(--tweet-color-blue-primary)',
              }}
            >
              <ReplyIcon />
            </div>
            <span
              style={{
                fontSize: 'var(--tweet-actions-font-size)',
                fontWeight: 'var(--tweet-actions-font-weight)',
                lineHeight: 'var(--tweet-actions-line-height)',
                marginLeft: '0.25rem',
              }}
            >
              Reply
            </span>
          </div>

          {/* Like */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginRight: '1.25rem',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: 'var(--tweet-actions-icon-wrapper-size)',
                height: 'var(--tweet-actions-icon-wrapper-size)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: '-0.25rem',
                borderRadius: '9999px',
              }}
            >
              <LikeIcon />
            </div>
            <span
              style={{
                fontSize: 'var(--tweet-actions-font-size)',
                fontWeight: 'var(--tweet-actions-font-weight)',
                lineHeight: 'var(--tweet-actions-line-height)',
                marginLeft: '0.25rem',
                color: 'var(--tweet-color-red-primary)',
              }}
            >
              Like
            </span>
          </div>

          {/* Share */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: 'auto',
              color: 'inherit',
            }}
          >
            <div
              style={{
                width: 'var(--tweet-actions-icon-wrapper-size)',
                height: 'var(--tweet-actions-icon-wrapper-size)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: '-0.25rem',
                borderRadius: '9999px',
              }}
            >
              <ShareIcon />
            </div>
            <span
              style={{
                fontSize: 'var(--tweet-actions-font-size)',
                fontWeight: 'var(--tweet-actions-font-weight)',
                lineHeight: 'var(--tweet-actions-line-height)',
                marginLeft: '0.25rem',
                color: 'var(--tweet-color-green-primary)',
              }}
            >
              Share
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
