import { window, ExtensionContext, commands, QuickPickItem, extensions } from 'vscode';
import { AzureAccount, AzureSession } from './azure-account-api'; // Other extensions need to copy this .d.ts to their repository.
import { SubscriptionClient, SubscriptionModels } from '@azure/arm-subscriptions';
// @ts-ignore
import { ResourceManagementClient } from '@azure/arm-resources';
// @ts-ignore
import { WebSiteManagementClient } from '@azure/arm-appservice';

interface SubscriptionItem {
    label: string;
    description: string;
    session: AzureSession;
    subscription: SubscriptionModels.Subscription;
}

export function showSubscriptions(api: AzureAccount) {
    return async () => {
        if (!(await api.waitForLogin())) {
            return commands.executeCommand('azure-account.askForLogin');
        }
        const subscriptionItems = loadSubscriptionItems(api);
        const result = await window.showQuickPick(subscriptionItems);
        if (result) {
            const resourceGroupItems = loadResourceGroupItems(result);
            await window.showQuickPick(resourceGroupItems);
        }
    };
}

export async function loadSubscriptionItems(api: AzureAccount) {
    await api.waitForFilters();
    const subscriptionItems: SubscriptionItem[] = [];
    for (const session of api.sessions) {
        const credentials = session.credentials2;
        const subscriptionClient = new SubscriptionClient(credentials);
        const subscriptions = await listAll(subscriptionClient.subscriptions, subscriptionClient.subscriptions.list());
        subscriptionItems.push(...subscriptions.map(subscription => ({
            label: subscription.displayName || '',
            description: subscription.subscriptionId || '',
            session,
            subscription
        })));
    }
    subscriptionItems.sort((a, b) => a.label.localeCompare(b.label));
    return subscriptionItems;
}

async function loadResourceGroupItems(subscriptionItem: SubscriptionItem) {
    const { session, subscription } = subscriptionItem;
    const resources = new ResourceManagementClient(session.credentials2, subscription.subscriptionId!);
    const resourceGroups = await listAll(resources.resourceGroups, resources.resourceGroups.list());
    resourceGroups.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    // @ts-ignore
    return resourceGroups.map(resourceGroup => ({
        label: resourceGroup.name || '',
        description: resourceGroup.location,
        resourceGroup
    }));
}

export function showAppServices(api: AzureAccount) {
    return async () => {
        if (!(await api.waitForLogin())) {
            return commands.executeCommand('azure-account.askForLogin');
        }
        const webAppItems = loadWebAppItems(api);
        await window.showQuickPick(webAppItems);
    };
}

async function loadWebAppItems(api: AzureAccount) {
    await api.waitForFilters();
    const webAppsPromises: Promise<QuickPickItem[]>[] = [];
    for (const filter of api.filters) {
        const client = new WebSiteManagementClient(filter.session.credentials2, filter.subscription.subscriptionId!);
        webAppsPromises.push(listAll(client.webApps, client.webApps.list())
            .then(webApps => webApps.map(webApp => {
                // @ts-ignore
                return {
                    label: webApp.name || '',
                    description: filter.subscription.displayName!,
                    webApp
                };
            })));
    }
    const webApps = (<QuickPickItem[]>[]).concat(...(await Promise.all(webAppsPromises)));
    webApps.sort((a, b) => a.label.localeCompare(b.label));
    return webApps;
}


export interface PartialList<T> extends Array<T> {
    nextLink?: string;
}

async function listAll<T>(client: { listNext(nextPageLink: string): Promise<PartialList<T>>; }, first: Promise<PartialList<T>>): Promise<T[]> {
    const all: T[] = [];
    for (let list = await first; list.length || list.nextLink; list = list.nextLink ? await client.listNext(list.nextLink) : []) {
        all.push(...list);
    }
    return all;
}
