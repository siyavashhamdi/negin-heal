export const FILE_UPLOAD_POLICY = {
  ANY: "ANY",
  AVATAR: "AVATAR",
  COURSE_COVER: "COURSE_COVER",
  COURSE_ITEM: "COURSE_ITEM",
  SUPPORT_ATTACHMENT: "SUPPORT_ATTACHMENT",
  PAYMENT_RECEIPT: "PAYMENT_RECEIPT",
  PAYMENT_EVIDENCE: "PAYMENT_EVIDENCE",
} as const;

export type FileUploadPolicyId =
  (typeof FILE_UPLOAD_POLICY)[keyof typeof FILE_UPLOAD_POLICY];

const ONE_GIBIBYTE = 1024 * 1024 * 1024;

export type FileUploadPolicyRule = {
  readonly maxSizeBytes: number;
  readonly allowedMimePatterns: readonly string[] | null;
  readonly allowedExtensions?: readonly string[];
};

export const FILE_UPLOAD_POLICIES: Record<FileUploadPolicyId, FileUploadPolicyRule> = {
  [FILE_UPLOAD_POLICY.ANY]: {
    maxSizeBytes: 50 * 1024 * 1024,
    allowedMimePatterns: null,
  },
  [FILE_UPLOAD_POLICY.AVATAR]: {
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimePatterns: ["image/"],
  },
  [FILE_UPLOAD_POLICY.COURSE_COVER]: {
    maxSizeBytes: 20 * 1024 * 1024,
    allowedMimePatterns: ["image/"],
  },
  [FILE_UPLOAD_POLICY.COURSE_ITEM]: {
    maxSizeBytes: ONE_GIBIBYTE,
    allowedMimePatterns: null,
  },
  [FILE_UPLOAD_POLICY.SUPPORT_ATTACHMENT]: {
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimePatterns: [
      "image/",
      "application/pdf",
      "text/",
      "video/",
      "audio/",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    allowedExtensions: [".doc", ".docx", ".txt", ".pdf"],
  },
  [FILE_UPLOAD_POLICY.PAYMENT_RECEIPT]: {
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimePatterns: ["image/", "application/pdf"],
    allowedExtensions: [".pdf"],
  },
  [FILE_UPLOAD_POLICY.PAYMENT_EVIDENCE]: {
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimePatterns: ["image/", "application/pdf"],
    allowedExtensions: [".pdf"],
  },
};
