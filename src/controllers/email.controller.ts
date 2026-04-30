import { Request, Response } from "express";
import Task from "../models/Task";
import User from "../models/User";
import { sendEmail } from "../services/email.service";

function getAuthUser(req: Request) {
  return (req as any).user;
}

function formatSeconds(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
    label: start.toISOString().slice(0, 10),
  };
}

async function getScopedTaskQuery(authUser: any) {
  if (authUser.role === "ADMIN") {
    return {};
  }

  if (authUser.role === "MEMBER") {
    return {
      assignedTo: authUser.id,
    };
  }

  if (authUser.role === "LEADER") {
    const members = await User.find({
      role: "MEMBER",
      leader: authUser.id,
      isActive: true,
    }).select("_id");

    const memberIds = members.map((member) => member._id);

    return {
      assignedTo: {
        $in: [authUser.id, ...memberIds],
      },
    };
  }

  return {
    assignedTo: authUser.id,
  };
}

function buildHtmlReport(params: {
  date: string;
  tasks: any[];
  senderName: string;
}) {
  const totalTasks = params.tasks.length;
  const completedTasks = params.tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const completionRate =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const rows = params.tasks
    .map((task) => {
      const project: any = task.project;
      const assignedTo: any = task.assignedTo;

      return `
        <tr>
          <td>${task.title}</td>
          <td>${project?.name || "N/A"}</td>
          <td>${assignedTo?.name || "N/A"}</td>
          <td>${task.status}</td>
          <td>${formatSeconds(task.timeSpentSeconds || 0)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>Team Report Manager - Daily Report</h2>
      <p><strong>Date:</strong> ${params.date}</p>

      <h3>Summary</h3>
      <ul>
        <li>Total Tasks: ${totalTasks}</li>
        <li>Completed Tasks: ${completedTasks}</li>
        <li>Completion Rate: ${completionRate}%</li>
      </ul>

      <h3>Task Table</h3>

      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background: #f2f2f2;">
            <th>Task</th>
            <th>Project</th>
            <th>Assigned To</th>
            <th>Status</th>
            <th>Time Spent</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows ||
            `<tr><td colspan="5" style="text-align:center;">No tasks found for today.</td></tr>`
          }
        </tbody>
      </table>

      <br />

      <p>Regards,</p>
      <p><strong>${params.senderName}</strong></p>
      <p style="font-size: 12px; color: #777;">Sent from Team Report Manager</p>
    </div>
  `;
}

export async function sendDailyReportEmail(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    const { to, cc, subject } = req.body;

    if (!to) {
      return res.status(400).json({
        message: "Recipient email is required.",
      });
    }

    const { start, end, label } = getTodayRange();
    const scopedQuery = await getScopedTaskQuery(authUser);

    const tasks = await Task.find({
      ...scopedQuery,
      taskDate: {
        $gte: start,
        $lt: end,
      },
    })
      .populate("project", "name description")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    const html = buildHtmlReport({
      date: label,
      tasks,
      senderName: authUser.name,
    });

    await sendEmail({
      to,
      cc,
      subject: subject || `Daily Team Report - ${label}`,
      html,
    });

    return res.json({
      message: "Daily report email sent successfully.",
    });
  } catch (error: any) {
    console.error("Email send error:", error);

    return res.status(500).json({
      message: error?.message || "Failed to send email report.",
    });
  }
}