import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/api';
import AppShell from '../../components/layout/AppShell';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const RulesList = ({ rules, onEdit, onDelete, onToggle }) => {
  if (!rules || rules.length === 0) {
    return (
      <EmptyState
        title="No rules yet"
        description="Create your first allocation rule to get started."
        action={
          <Button onClick={onEdit}>
            Create Rule
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => (
        <div
          key={rule.id}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#534AB7] transition-colors"
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center justify-center w-8 h-8 bg-[#534AB7] text-white rounded-full text-sm font-bold">
              {index + 1}
            </span>
            <div>
              <h3 className="font-medium text-gray-900">{rule.name}</h3>
              <p className="text-sm text-gray-500">
                {rule.triggerEvent} → {rule.actionType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => onToggle(rule)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#534AB7] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#534AB7] relative"></div>
            </label>
            <Button variant="ghost" size="sm" onClick={() => onEdit(rule)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(rule.id)}>
              Delete
            </Button>
          </div>
        </div>
      ))}
      <Button onClick={onEdit} className="mt-4">
        Add New Rule
      </Button>
    </div>
  );
};

const RuleBuilderModal = ({ isOpen, onClose, rule, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    triggerEvent: 'allocate',
    conditions: [{ field: 'amount', operator: 'gt', value: '' }],
    actionType: 'allocate',
    actionParams: { tax: 30, operations: 50, growth: 20 },
    priority: 1,
  });

  useState(() => {
    if (rule) {
      setFormData(rule);
    }
  }, [rule]);

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { field: 'amount', operator: 'gt', value: '' }],
    });
  };

  const removeCondition = (index) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={rule ? 'Edit Rule' : 'Create Rule'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#534AB7]"
            placeholder="e.g., High Revenue Allocation"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Event</label>
          <select
            value={formData.triggerEvent}
            onChange={(e) => setFormData({ ...formData, triggerEvent: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#534AB7]"
          >
            <option value="allocate">Allocate</option>
            <option value="assess">Assess</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Conditions</label>
          <div className="space-y-2">
            {formData.conditions.map((condition, index) => (
              <div key={index} className="flex gap-2">
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(index, 'field', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="amount">Amount</option>
                  <option value="currency">Currency</option>
                  <option value="source">Source</option>
                </select>
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="gt">&gt;</option>
                  <option value="lt">&lt;</option>
                  <option value="gte">≥</option>
                  <option value="lte">≤</option>
                  <option value="eq">=</option>
                  <option value="neq">≠</option>
                </select>
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Value"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(index)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addCondition} className="mt-2">
            Add Condition
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500">Tax (%)</label>
              <input
                type="number"
                value={formData.actionParams?.tax || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actionParams: { ...formData.actionParams, tax: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Operations (%)</label>
              <input
                type="number"
                value={formData.actionParams?.operations || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actionParams: {
                      ...formData.actionParams,
                      operations: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Growth (%)</label>
              <input
                type="number"
                value={formData.actionParams?.growth || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    actionParams: { ...formData.actionParams, growth: parseInt(e.target.value) || 0 },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Rule</Button>
        </div>
      </form>
    </Modal>
  );
};

const Rules = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      const response = await apiClient.get('/rules');
      return response.data.rules || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (ruleData) => {
      const response = await apiClient.post('/rules', ruleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rules']);
      setIsModalOpen(false);
      setEditingRule(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...ruleData }) => {
      const response = await apiClient.put(`/rules/${id}`, ruleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rules']);
      setIsModalOpen(false);
      setEditingRule(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await apiClient.delete(`/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rules']);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }) => {
      const response = await apiClient.put(`/rules/${id}`, { enabled });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rules']);
    },
  });

  const handleEdit = (rule) => {
    setEditingRule(rule || null);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggle = (rule) => {
    toggleMutation.mutate({ id: rule.id, enabled: !rule.enabled });
  };

  const handleSave = (ruleData) => {
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, ...ruleData });
    } else {
      createMutation.mutate(ruleData);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Rules Manager</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <Card>
            <CardContent>
              <RulesList
                rules={rules}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            </CardContent>
          </Card>
        )}

        <RuleBuilderModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRule(null);
          }}
          rule={editingRule}
          onSave={handleSave}
        />
      </div>
    </AppShell>
  );
};

export default Rules;
