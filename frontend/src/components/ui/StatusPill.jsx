

const StatusPill = ({ status, className = '' }) => {
  const styles = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    failed: 'bg-gray-100 text-gray-800',
    active: 'bg-emerald-100 text-emerald-800',
    inactive: 'bg-gray-100 text-gray-600',
  };

  const labels = {
    success: 'Success',
    error: 'Error',
    pending: 'Pending',
    processing: 'Processing',
    failed: 'Failed',
    active: 'Active',
    inactive: 'Inactive',
  };

  const style = styles[status] || styles.failed;
  const label = labels[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {label}
    </span>
  );
};

export default StatusPill;
