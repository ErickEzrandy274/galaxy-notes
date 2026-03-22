'use client';

import { forwardRef } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Allow blob: URLs in images so local previews work during upload.
// Quill's default Image blot only allows http, https, and data protocols,
// which causes blob: URLs to be sanitized to //:0.
const ImageBlot = Quill.import('formats/image') as typeof Quill.import & {
  sanitize: (url: string) => string;
};
const originalSanitize = ImageBlot.sanitize;
ImageBlot.sanitize = function (url: string) {
  if (url?.startsWith('blob:')) return url;
  return originalSanitize.call(this, url);
};

const QuillEditor = forwardRef<ReactQuill, ReactQuill.ReactQuillProps>(
  function QuillEditor(props, ref) {
    return <ReactQuill ref={ref} {...props} />;
  },
);

export default QuillEditor;
