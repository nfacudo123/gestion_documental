

export class RequestWithUser extends Request {
  user: {
    role: string;
    tenantId: string;
  };
}