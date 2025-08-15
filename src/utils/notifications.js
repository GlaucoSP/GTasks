import * as Notifications from 'expo-notifications';

export const requestNotificationPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Permissão de notificação negada');
    return false;
  }
  return true;
};

export const scheduleTaskNotification = async (task) => {
  try {
    // Cancelar notificações existentes para esta tarefa
    await cancelTaskNotifications(task.id);
    
    // Notificação para o prazo
    const deadlineDate = new Date(task.deadline);
    if (deadlineDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Prazo da tarefa!',
          body: `A tarefa "${task.title}" vence hoje!`,
          data: { taskId: task.id, type: 'deadline' },
        },
        trigger: deadlineDate,
        identifier: `deadline_${task.id}`,
      });
    }

    // Notificação personalizada se definida
    if (task.remindAt) {
      const reminderDate = new Date(task.remindAt);
      if (reminderDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Lembrete de tarefa',
            body: `Lembrete: ${task.title}`,
            data: { taskId: task.id, type: 'reminder' },
          },
          trigger: reminderDate,
          identifier: `reminder_${task.id}`,
        });
      }
    }
  } catch (error) {
    console.error('Erro ao agendar notificação:', error);
  }
};

export const cancelTaskNotifications = async (taskId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(`deadline_${taskId}`);
    await Notifications.cancelScheduledNotificationAsync(`reminder_${taskId}`);
  } catch (error) {
    console.error('Erro ao cancelar notificações:', error);
  }
};