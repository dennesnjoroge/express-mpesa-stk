import PDFDocument from "pdfkit";

export interface UserDataExport {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: Date;
  };

  subscriptions: Array<{
    id: string;
    plan: string;
    status: string;
    startAt: Date;
    expiresAt: Date;
  }>;

  payments: Array<{
    id: string;
    amount: number;
    status: string;
    receipt: string | null;
    createdAt: Date;
  }>;
}

const generatedAt = new Date().toLocaleString("en-KE", {
  dateStyle: "long",
  timeStyle: "short",
});

export function generateUserDataPdf(data: UserDataExport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", reject);

    doc.fontSize(20).text("Account Data Export", { align: "center" });

    doc.moveDown();

    doc.fontSize(10).text(`Generated: ${generatedAt}`);

    doc.moveDown(2);

    // user
    doc.fontSize(16).text("Account Information");
    doc.moveDown();

    doc
      .fontSize(11)
      .text(`ID: ${data.user.id}`)
      .text(`Name: ${data.user.firstName} ${data.user.lastName}`)
      .text(`Email: ${data.user.email}`)
      .text(
        `Created: ${data.user.createdAt.toLocaleString("en-KE", {
          dateStyle: "long",
          timeStyle: "short",
        })}`,
      );

    // subscriptions
    doc.moveDown(2);
    doc.fontSize(16).text("Subscriptions");
    doc.moveDown();

    for (const subscription of data.subscriptions) {
      doc
        .fontSize(11)
        .text(`Plan: ${subscription.plan}`)
        .text(`Status: ${subscription.status}`)
        .text(
          `Start: ${subscription.startAt.toLocaleString("en-KE", {
            dateStyle: "long",
            timeStyle: "short",
          })}`,
        )
        .text(
          `Expires: ${subscription.expiresAt.toLocaleString("en-KE", {
            dateStyle: "long",
            timeStyle: "short",
          })}`,
        )
        .moveDown();
    }

    // payments
    doc.fontSize(16).text("Payments");
    doc.moveDown();

    for (const payment of data.payments) {
      doc
        .fontSize(11)
        .text(`Amount: KES ${payment.amount}`)
        .text(`Status: ${payment.status}`)
        .text(`Receipt: ${payment.receipt ?? "N/A"}`)
        .text(
          `Date: ${payment.createdAt.toLocaleString("en-KE", {
            dateStyle: "long",
            timeStyle: "short",
          })}`,
        )
        .moveDown();
    }

    doc.end();
  });
}
