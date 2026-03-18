import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import { Users, Shield, CheckCircle, XCircle, Search, Filter, Trash2, Edit } from 'lucide-react';

const roleLabels = { shipper: '货主', driver: '司机', forwarder: '货代', admin: '管理员' };
const roleBadgeColors = { shipper: 'badge-blue', driver: 'badge-green', forwarder: 'badge-purple', admin: 'badge-red' };
const statusLabels = { active: '正常', suspended: '已暂停', pending_review: '待审核' };
const statusColors = { active: 'badge-green', suspended: 'badge-red', pending_review: 'badge-yellow' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role: '', status: '' });

  useEffect(() => { loadUsers(); }, [filter]);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers(filter);
      setUsers(res.data.users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleVerify(userId, action) {
    const label = action === 'approve' ? '通过' : '拒绝';
    if (!confirm(`确认${label}该用户的资质审核？`)) return;
    try {
      await adminAPI.verifyUser(userId, { action });
      alert(`已${label}审核`);
      loadUsers();
    } catch (err) { alert(err.response?.data?.error || '操作失败'); }
  }

  async function handleToggleStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const label = newStatus === 'active' ? '启用' : '暂停';
    if (!confirm(`确认${label}该用户？`)) return;
    try {
      await adminAPI.updateUserStatus(userId, { status: newStatus });
      loadUsers();
    } catch (err) { alert(err.response?.data?.error || '操作失败'); }
  }

  async function handleDelete(userId, name) {
    if (!confirm(`确认删除用户「${name}」？此操作不可恢复！`)) return;
    try {
      await adminAPI.deleteUser(userId);
      alert('用户已删除');
      loadUsers();
    } catch (err) { alert(err.response?.data?.error || '删除失败'); }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Users className="w-5 h-5 text-ocean-500" /> 用户管理
      </h2>

      <div className="flex flex-wrap gap-2">
        <select className="input-field py-2 text-sm w-auto" value={filter.role} onChange={(e) => setFilter({...filter, role: e.target.value})}>
          <option value="">全部角色</option>
          <option value="shipper">货主</option><option value="driver">司机</option>
          <option value="forwarder">货代</option><option value="admin">管理员</option>
        </select>
        <select className="input-field py-2 text-sm w-auto" value={filter.status} onChange={(e) => setFilter({...filter, status: e.target.value})}>
          <option value="">全部状态</option>
          <option value="active">正常</option><option value="pending_review">待审核</option><option value="suspended">已暂停</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">用户</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">角色</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">联系方式</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">信用分</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">订单</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">状态</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">
                          {(u.real_name || u.username)[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{u.real_name || u.username}</p>
                          <p className="text-xs text-gray-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={roleBadgeColors[u.role]}>{roleLabels[u.role]}</span></td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{u.phone || '-'}</p>
                      {u.company_name && <p className="text-xs text-gray-400">{u.company_name}</p>}
                      {u.license_plate && <p className="text-xs text-gray-400">车牌: {u.license_plate}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${u.credit_score >= 90 ? 'text-green-600' : u.credit_score >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                        {u.credit_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.completed_orders}/{u.total_orders}</td>
                    <td className="px-4 py-3"><span className={statusColors[u.status]}>{statusLabels[u.status]}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {u.status === 'pending_review' && (
                          <>
                            <button onClick={() => handleVerify(u.id, 'approve')} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="通过审核">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleVerify(u.id, 'reject')} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="拒绝审核">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {u.status !== 'pending_review' && u.role !== 'admin' && (
                          <button onClick={() => handleToggleStatus(u.id, u.status)}
                            className={`px-2 py-1 rounded text-xs ${u.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {u.status === 'active' ? '暂停' : '启用'}
                          </button>
                        )}
                        {u.role !== 'admin' && (
                          <button onClick={() => handleDelete(u.id, u.real_name || u.username)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="删除用户">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
