type PageHeaderProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
};

/**
 * PageHeader: Main page heading with title and description.
 *
 * The h1 element is set with tabindex="-1" to make it focusable for
 * accessibility purposes. This allows focus to be restored to the
 * page heading after route changes or modal dismissals without
 * affecting tab order.
 */
export function PageHeader({ actions, description, title }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <h1
          tabIndex={-1}
          className="text-2xl font-semibold text-slate-950 sm:text-3xl outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-sm"
        >
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
